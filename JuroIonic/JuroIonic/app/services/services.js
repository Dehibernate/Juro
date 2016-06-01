angular.module('starter.services', [])
  .service('AuthService', function (DBService, superlogin, $state) {
    this.login = (username, password) => {
      if (!(username && password))
        throw Error("All fields must have a value");

      return superlogin.login({username: username, password: password})
        .then(() => DBService.initSync());
    };

    this.logout = () => {
      DBService.stopRemoteSync();
      $state.go("login");
      return superlogin.logout();
    };

    this.logoutAll = () => {
      DBService.stopRemoteSync();
      DBService.destroyLocalDB();
      $state.go("login");
      return superlogin.logoutAll();
    };

    this.signup = (username, email, password, confirmPassword) => {
      if (!(username && email && password && confirmPassword))
        throw Error("All fields must have a value");

      return superlogin.register({
        name: username,
        username: username,
        email: email,
        password: password,
        confirmPassword: confirmPassword
      });
    };

    this.forgotPassword = (email) => {
      if (!email)
        throw Error("Email must have a value");

      return superlogin.forgotPassword(email);
    };

    this.resetPassword = (token, password, confirmPassword) => {
      if (!(token && password && confirmPassword))
        throw Error("All fields must have a value");

      return superlogin.resetPassword({
        token: token,
        password: password,
        confirmPassword: confirmPassword
      });
    }
  })
  .service('DBService', function ($ionicPopup, $rootScope, $state, superlogin) {
    var showAlert = (text, title) =>
      $ionicPopup.alert({
        title: title,
        template: text
      });

    var localDB;
    var localChanges;

    var user;
    var dbAdapter;

    var getLocalDB = () => localDB;
    var getUser = () => user;
    var getDBAdapter = () => dbAdapter;

    var remoteDB;
    var remoteSync;
    var remoteChanges;

    //MAKE SURE THE ADDRESS POINTS TO THE JURO SERVER
    var remoteUrl = "http://localhost:3000";

    //Initialise synchronisation with the remote user database on the CouchDB server
    var initSync = () => {
      //Get session
      var session = superlogin.getSession();
      //console.log("SESSION", session);
      if (session == null)
        throw new Error("User must be authorised");

      //Clean up old database events
      if (localChanges) localChanges.cancel();
      if (remoteSync) remoteSync.cancel();
      if (remoteChanges) remoteChanges.cancel();

      //Create new database
      localDB = new PouchDB(session.user_id, {auto_compaction: true});
      localChanges = localDB.changes({since: 'now', live: true})
        .on('change', (change) => $rootScope.$broadcast("db-change", change));

      //Initialise the database and retrieve the adapter type (should be idb)
      localDB.info().then(x => {
        console.log(x.db_name, x.adapter);
        user = x.db_name;
        dbAdapter = x.adapter;
      });

      //Setup remote synchronisation and start tracking changes, monitoring for invalidated sessions
      var initAll = () => {
        //Get userDB and setup remote options
        var dbname = session.userDBs.supertest.split('/')[3];
        var options = {
          skipSetup: true,
          ajax: {headers: {"Authorization": "Basic " + btoa(session.token + ":" + session.password)}}
        };

        remoteDB = new PouchDB(remoteUrl + "/" + dbname + "/", options);
        remoteSync = localDB.sync(remoteDB, {live: true, retry: true})
          .on('error', (err) => console.log("totally unhandled error (shouldn't happen) " + err))
          .on('complete', e => {
            console.log("Sync Cancelled", e);
            if (_.find(_.union(e.pull.errors, e.push.errors), x => x.status == 401) != undefined) {
              console.log("Unauthorised user detected. Terminating session.");
              showAlert("Your session has been forcefully terminated.", "Secure Logout");
              stopRemoteSync();
              destroyLocalDB();
              $state.go('login');
            }
          });

        //If the client detects that the session is invalidated it most likely means Secure Logout was performed
        //In this case the local database is destroyed and the user data deleted from this device
        remoteChanges = remoteDB.changes({since: 'now', live: true})
          .on('error', (error) => {
            console.log("CHANGE ERROR", error);
            if (error.status == 401) {
              destroyLocalDB();
            }
          });
      };

      //Refresh the login session and navigate to the Today page
      superlogin.refresh()
        .then(() => {
          if (superlogin.authenticated()) {
            initAll();
            $state.go("tab.today");
          }
        })
        .catch(() => {
          console.log("Failed to refresh", superlogin.authenticated());
          if (superlogin.authenticated()) {
            initAll();
            $state.go("tab.today");
          }
        });
    };

    //If authenticated, start synchronisation
    if (superlogin.authenticated()) {
      initSync();
    }

    var stopRemoteSync = () => {
      if (remoteSync) remoteSync.cancel();
      if (remoteChanges) remoteChanges.cancel();
      remoteDB = null;
      remoteSync = null;
      remoteChanges = null;
    };

    var destroyLocalDB = () => {
      if (localChanges) localChanges.cancel();
      if (localDB)
        localDB.destroy();

      localChanges = null;
      localDB = null;
    };

    this.initSync = initSync;

    this.destroyLocalDB = destroyLocalDB;
    this.stopRemoteSync = stopRemoteSync;

    this.getDB = getLocalDB;
    this.getUser = getUser;
    this.getDBAdapter = getDBAdapter;
  })
  .service('SchedulesService', function (DBService, moment) {
    //Gets all schedules from db
    this.getAll = () =>
      DBService.getDB().allDocs({
        include_docs: true
      }).then(e => _.pluck(e.rows, 'doc'));

    //Adds a schedule to map and returns schedule date
    this.addSchedule = (_date, _tasks) => {
      if (_date == undefined || !moment(_date, 'DD-MM-YYYY', true).isValid())
        throw new Error("Invalid date or format of " + _date);

      _tasks = _tasks || [];

      if (!Array.isArray(_tasks))
        throw new Error("Tasks must be an array");

      return DBService.getDB().put({
        _id: _date.format("DD-MM-YYYY"),
        date: _date.format("DD/MM/YYYY"),
        tasks: _tasks
      })
    };

    this.removeSchedule = schedule => DBService.getDB().remove(schedule);
    this.getSchedule = date => DBService.getDB().get(date);

    var updateSchedule = schedule => DBService.getDB().put(schedule);
    this.updateSchedule = updateSchedule;

    //Takes schedule date and task object, returns task id
    this.addTask = (schedule, task) => {
      if (task.startTime && task.endTime) {
        task._id = moment().toString();
        task.status = task.status || 'inactive';
        schedule.tasks.push(task);
        return updateSchedule(schedule);
      } else {
        throw new Error("Can't add task with incorrect start/end times to schedule");
      }
    };

    //Takes schedule date, task id and new Task value and returns true/false
    this.updateTask = (schedule, task) => {
      if (task.startTime && task.endTime) {
        var index = _.findIndex(schedule.tasks, {
          _id: task._id
        });

        schedule.tasks[index] = task;
        return updateSchedule(schedule);
      } else {
        throw new Error("Can't add task with incorrect start/end times to schedule");
      }
    };

    //Takes schedule date, task id and returns
    this.removeTask = (schedule, task) => {
      var index = schedule.tasks.indexOf(task);
      schedule.tasks.splice(index, 1);
      return updateSchedule(schedule);
    }
  })
  .service('TaskHelperService', function () {
    var calculateStatus = (task) => {
      if (task.startedOn == undefined) {
        task.status = 'inactive';
      } else {

        var startTime = moment(task.startTime);
        var endTime = moment(task.endTime);
        var startedOn = moment(task.startedOn);
        var finishedOn = moment(task.finishedOn);
        var totalTime = endTime.diff(startTime, 'seconds');

        var status;
        //If the task is started before 10% of its duration is elapsed, it's
        if (startedOn.diff(startTime, 'seconds') <= 0.10 * totalTime)
          status = 4;
        //If the task is started after to 11-20% of its duration is elapsed, it's content
        else if (startedOn.diff(startTime, 'seconds') <= 0.20 * totalTime)
          status = 3;
        //If the task is started after 21%-30% of its duration is elapsed, it's unhappy
        else if (startedOn.diff(startTime, 'seconds') <= 0.30 * totalTime)
          status = 2;
        //If the task is started after 30% of its duration is elapsed, it's sad
        else if (startedOn.diff(startTime, 'seconds') > 0.30 * totalTime)
          status = 1;

        if (task.finishedOn != undefined) {
          //If the task finishes up to 10% of its duration before it's due, add 2 to status
          if (finishedOn.diff(endTime, 'seconds') <= 0.25 * -totalTime)
            status += 2;
          //If the task finishes before the end time, add 1 to status
          else if (finishedOn.isBefore(moment(endTime).add(1, 'seconds')))
            status += 1;
          //Otherwise subtract 1 from status for every 10% of the task duration overdue
          else
            status -= Math.ceil(finishedOn.diff(endTime, 'seconds') / totalTime / 0.10);
        }

        if (status <= 1) task.status = 'sad';
        if (status == 2) task.status = 'unhappy';
        if (status == 3) task.status = 'content';
        if (status >= 4) task.status = 'happy';
      }
    };

    var isStartBeforeEnd = (startTime, endTime, strict) => {
      //Check if both are valid dates
      startTime = moment(startTime, strict);
      endTime = moment(endTime, strict);

      return startTime
        .add(5, 'minutes')
        .subtract(1, 'seconds')
        .isBefore(endTime);
    };

    this.Task = (name, startTime, endTime, startedOn, finishedOn) => {
      var task = {};
      task.name = name || "";

      var newStart = startTime ? new Date(startTime) : new Date();
      task.startTime = moment(newStart ? new Date(newStart) : new Date()).startOf('minute');
      task.endTime = endTime ? moment(new Date(endTime)).startOf('minute') : moment(task.startTime).add(10, 'minutes');

      if (startedOn) {
        task.startedOn = moment(new Date(startedOn));

        if (finishedOn)
          task.finishedOn = moment(new Date(finishedOn));
      }

      //Ensure start time is before end time
      if (!isStartBeforeEnd(task.startTime, task.endTime)) {
        throw new Error("End time must be after start time. Minimum task length is 5 minutes.");
      }

      //Ensure start time is before end time
      if (task.startedOn && task.finishedOn && !isStartBeforeEnd(task.startedOn, task.finishedOn))
        throw new Error("Task cannot be finished before it's been started");

      //Convert start and end times to Date objects
      task.startTime = task.startTime.toDate();
      task.endTime = task.endTime.toDate();

      //Set status
      calculateStatus(task);

      return task;
    };

    this.calculateStatus = calculateStatus;
    this.isStartBeforeEnd = isStartBeforeEnd;

    this.start = (task) => {
      task.startedOn = moment().toString();
      calculateStatus(task);
    };

    this.stop = (task) => {
      task.startedOn = undefined;
      calculateStatus(task);
    };

    this.finish = (task) => {
      task.finishedOn = moment().toString();
      calculateStatus(task);
    };
  });
