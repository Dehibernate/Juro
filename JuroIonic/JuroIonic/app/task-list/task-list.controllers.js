angular.module('starter.controllers')
  .controller('TaskListCtrl', function ($scope, $ionicPopup, $ionicListDelegate, $stateParams, TaskHelperService, SchedulesService, moment) {
    $scope.schedule = {};
    $scope.data = {};
    $scope.data.showReorder = false;

    //Update the schedule and the list of tasks. Called upon database change or when entering the view
    var updateSchedule = () => {
      $scope.date = $stateParams.date || moment().format('DD-MM-YYYY');
      SchedulesService.getSchedule($scope.date).then((schedule) => {
        if (!$scope.schedule || schedule && $scope.schedule._rev != schedule._rev) {
          $scope.schedule = schedule || {};
          $scope.$digest();
        }
      }).catch((err) => {
        console.log("Error retrieving schedule", err);
        $scope.schedule = undefined;
        $scope.$digest();
      });
    };

    $scope.$on('db-change', () => updateSchedule());

    $scope.$on('$ionicView.enter', ()=> updateSchedule());

    $scope.formatTime = (time) => moment(time).format("HH:mm");

    //Provides the path to an image based on the task status
    //Used for displaying the emoticons
    $scope.getStatusImage = (task) => {
      if (task.status != 'inactive' && !task.finishedOn) return 'img/hourglass.png';

      return {
        'inactive': "img/sleeping.png",
        'happy': "img/happy.png",
        'content': "img/content.png",
        'unhappy': "img/unhappy.png",
        'sad': "img/sad.png"
      }[task.status];
    };

    //Used for the task reordering system. Handles when a task is dropped onto another
    $scope.moveItem = (task, from, to) => {
      //If items are different, change the task. Make sure it's not started
      if (from != to && task.finishedOn == undefined && task.startedOn == undefined) {
        var duration = moment(task.endTime).diff(moment(task.startTime), 'minutes');

        //Calculate new start and end times. Sort first to ensure the indices match with the array (to and from)
        var newStartTime = _.sortBy($scope.schedule.tasks, 'startTime')[to].endTime;
        var newEndTime = moment(newStartTime).add(duration, 'minutes').toDate();

        //If the day has overflowed show error and abort operation
        if (moment(newStartTime).get('day') != moment(newEndTime).get('day')) {
          console.log(moment(newStartTime).get('day'), moment(newEndTime).get('day'));
          $ionicPopup.alert({
            title: 'Error',
            template: 'The task you are trying to move is too long to move at the end of the day. Please reduce its duration or move it earlier in the schedule.'
          });

          return;
        }

        $ionicPopup.confirm({
          title: 'Move Task',
          template: "Please confirm the following changes before moving the task" + '<br><label><b>' + task.name + '</b></label> ' + '<br>New start time: ' + moment(newStartTime).format('HH:mm') + '<br>New end time: ' + moment(newEndTime).format('HH:mm')
        }).then((res) => {
          if (!res) return;

          task.startTime = newStartTime;
          task.endTime = newEndTime;
          SchedulesService.updateSchedule($scope.schedule);
        });
      }
    };

    $scope.isScheduleOld = () => $scope.schedule != undefined && moment($scope.schedule.date, 'DD/MM/YYYY').startOf('day').isBefore(moment().startOf('day'));

    $scope.createSchedule = () => SchedulesService.addSchedule(moment($scope.date, 'DD-MM-YYYY', true), []);

    $scope.remove = task => {
      $ionicPopup.confirm({
        title: 'Delete Task',
        template: 'Are you sure you want to delete <br> <label><b>' + task.name + '</b></label>'
      }).then(res => {
        if (!res) return;

        SchedulesService.removeTask($scope.schedule, task);
        $ionicListDelegate.$getByHandle('taskList').closeOptionButtons();
      });
    };

    $scope.activate = (task) => {
      TaskHelperService.start(task);
      SchedulesService.updateSchedule($scope.schedule);
      $ionicListDelegate.$getByHandle('taskList').closeOptionButtons();
    };

    $scope.deactivate = (task) => {
      TaskHelperService.stop(task);
      SchedulesService.updateSchedule($scope.schedule);
      $ionicListDelegate.$getByHandle('taskList').closeOptionButtons();
    };

    $scope.finish = (task) => {
      TaskHelperService.finish(task);
      SchedulesService.updateSchedule($scope.schedule);
      $ionicListDelegate.$getByHandle('taskList').closeOptionButtons();
    };
  })
  .controller('EditTaskCtrl', function ($scope, $stateParams, $ionicHistory, TaskHelperService, SchedulesService, moment) {
    //Force back button to show explicitly.
    //Otherwise it doesn't show when navigating from a child of a tab
    $scope.$on('$ionicView.beforeEnter', (event, viewData) => viewData.enableBack = true);

    $scope.$on('$ionicView.enter', () => {
      console.log("TaskParams", $stateParams);
      SchedulesService.getSchedule($stateParams.schedule_id).then(schedule => {
        $scope.schedule = schedule || {};
        $scope.task = $stateParams.task || new TaskHelperService.Task("", moment());

        //Ensure dates are in the correct format
        $scope.task.startTime = moment($scope.task.startTime).startOf('minute').toDate();
        $scope.task.endTime = moment($scope.task.endTime).startOf('minute').toDate();

        //Automatically adjust start and end time, so they are correct
        $scope.$watch('task.startTime', () => {
          if (!TaskHelperService.isStartBeforeEnd($scope.task.startTime, $scope.task.endTime))
            $scope.task.endTime = moment($scope.task.startTime).startOf('minute').add(5, 'minutes').toDate();
        });

        $scope.$watch('task.endTime', () => {
          if (!TaskHelperService.isStartBeforeEnd($scope.task.startTime, $scope.task.endTime))
            $scope.task.startTime = moment($scope.task.endTime).startOf('minute').subtract(5, 'minutes').toDate();
        });

        //Set cursor focus to the name text box
        document.getElementById("taskName").focus();
        $scope.$digest();
      }).catch(err => console.log("Error retrieving schedule", err));
    });

    //Add task
    $scope.add = () => {
      //Get latest version of schedule in case it's changed
      SchedulesService.getSchedule($scope.schedule._id).then(schedule => {
        var action = $scope.task._id ? "updateTask" : "addTask";
        SchedulesService[action](schedule, $scope.task)
          .then(() => $ionicHistory.goBack());
      });
    };
  });
