describe('Services', function () {
  var ionicPopup;
  var state;

  beforeEach(module(function () {
    ionicPopup = {};
    state = {
      go: function () { }
    };

    spyOn(state, "go");
  }));

  //Replace localForage with a mock
  beforeEach(module(function ($provide) {
    $provide.value('$ionicPopup', ionicPopup);
    $provide.value('$state', state);
  }));

  //Load the initial modules
  beforeEach(module('starter.services'));


  //AuthService tests
  describe('AuthService makes the correct HTTP requests', function () {
    //Mock objects
    var authService, httpBackend;

    beforeEach(module('superlogin'));
    beforeEach(inject(function (_AuthService_, $httpBackend) {
      authService = _AuthService_;

      //Define mock responses to requests to the Juro server API
      httpBackend = $httpBackend;
      
      httpBackend.when('POST', '/auth/login').respond(200, {
        "issued": new Date(),
        "expires": new Date(new Date().getTime() + 60 * 60 * 1000),
        "provider": "local",
        "ip": "::ffff:109.155.13.128",
        "token": "dmMbs3MOQsCu2dd5mwtV9A",
        "password": "e6y65_pdTQiiVAcU--7xpA",
        "user_id": "joe",
        "roles": [
          "user"
        ],
        "userDBs": {
          "supertest": "http://dmMbs3MOQsCu2dd5mwtV9A:e6y65_pdTQiiVAcU--7xpA@localhost:5985/supertest$joe"
        }
      });

      httpBackend.when('POST', '/auth/register').respond(200, {});
      httpBackend.when('POST', '/auth/refresh').respond(200, {});
      httpBackend.when('POST', '/auth/logout').respond(200, {});
      httpBackend.when('POST', '/auth/logout-all').respond(200, {});
      httpBackend.when('POST', '/auth/forgot-password').respond(200, {});
      httpBackend.when('POST', '/auth/password-reset').respond(200, {});
    }));

    it('can get instance of AuthService', function () {
      expect(authService).toBeDefined();
    });

    it('sends a login request upon login', function () {
      //Make sure it can't be called without parameters
      expect(authService.login).toThrow();
      
      //MAKE SURE THIS IS AN EXISTING USER
      authService.login("joe", "pass_123");
      httpBackend.expectPOST('/auth/login');
      httpBackend.flush();
    });

    it('sends a logout request upon logout and redirects to login page', function () {
      authService.logout();
      httpBackend.expectPOST('/auth/logout');
      httpBackend.flush();
      expect(state.go).toHaveBeenCalledWith("login");
    });

    it('sends a logout-all request upon secure logout and redirects to login page', function () {
      authService.logoutAll();
      httpBackend.expectPOST('/auth/logout-all');
      httpBackend.flush();
      expect(state.go).toHaveBeenCalledWith("login");
    });

    it('sends a register request upon signup', function () {
      //Make sure it can't be called without parameters
      expect(authService.signup).toThrow();
      authService.signup("joe", "joe@email.com", "password", "password");
      httpBackend.expectPOST('/auth/register');
      httpBackend.flush();
    });

    it('sends a forgot-password request upon forgotPassword', function () {
      //Make sure it can't be called without parameters
      expect(authService.forgotPassword).toThrow();
      authService.forgotPassword("email");
      httpBackend.expectPOST('/auth/forgot-password');
      httpBackend.flush();
    });

    it('sends a password-reset request upon resetPassword', function () {
      //Make sure it can't be called without parameters
      expect(authService.resetPassword).toThrow();
      authService.resetPassword("token", "password", "confirmPassword");
      httpBackend.expectPOST('/auth/password-reset');
      httpBackend.flush();
    });
  });

  //TaskHelperService
  describe('TaskHelperService', function () {

    beforeEach(module('angularMoment'));

    var taskHelperService;
    beforeEach(inject(function (_TaskHelperService_) {
      taskHelperService = _TaskHelperService_;
    }));

    it('can correctly check if start date is before end date', function () {
      expect(taskHelperService.isStartBeforeEnd(moment(), moment().add(5, 'minutes'))).toBe(true);
      expect(taskHelperService.isStartBeforeEnd(moment(), moment().subtract(5, 'minutes'))).toBe(false);
    })

    it('can create tasks with valid times', function () {
      var name = "Task 1";
      var startTime = moment("2016-03-05T12:00:00.000Z");
      var endTime = moment("2016-03-05T13:00:00.000Z");
      var task = new taskHelperService.Task(name, startTime, endTime)

      expect(task.startTime.toString()).toBe(startTime.toDate().toString());
      expect(task.endTime.toString()).toBe(endTime.toDate().toString());
    });

    it('throws an exception if a task has invalid times', function () {
      var startTime = moment("2016-03-05T12:00:00.000Z");
      var endTime = moment("2016-03-05T13:00:00.000Z");

      expect(function () { new taskHelperService.Task("Task") }).not.toThrow();
      expect(function () { new taskHelperService.Task("Task", startTime) }).not.toThrow();
      expect(function () { new taskHelperService.Task(undefined, startTime, endTime) }).not.toThrow();
      expect(function () { new taskHelperService.Task(null, startTime, endTime) }).not.toThrow();

      expect(function () { new taskHelperService.Task("Task", "Invalid date", endTime) }).toThrow();
      expect(function () { new taskHelperService.Task("Task", startTime, "Invalid date") }).toThrow();
      expect(function () { new taskHelperService.Task("Task", "Invalid date", "Invalid date") }).toThrow();
      
      //Throw exception if startTime is after endTime
      expect(function () { new taskHelperService.Task("Task", endTime, startTime) }).toThrow();
    });

    it('calculates the task status correctly based on their starting/startedOn/finishedOn/end tiems', function () {
      //Define start and end times
      var startTime = moment("2016-03-05T12:00:00.000Z");
      var endTime = moment(startTime).add(1, 'hour');
      var duration = endTime.diff(startTime, 'seconds');
      expect(duration).toBe(60 * 60);

      var testStartedTask = function (percentAfter, expectedStatus) {
        expect(new taskHelperService.Task("Task", startTime, endTime, moment(startTime).add(duration * percentAfter, 'seconds')).status).toBe(expectedStatus);
      }

      //Task that's not been activated should be 'inactive'
      expect(new taskHelperService.Task("Task", startTime, endTime).status).toBe('inactive');

      //Test tasks with StartedOn time only
      testStartedTask(-0.05, 'happy');
      testStartedTask(0.1, 'happy');
      testStartedTask(0.11, 'content');
      testStartedTask(0.20, 'content');
      testStartedTask(0.21, 'unhappy');
      testStartedTask(0.30, 'unhappy');
      testStartedTask(0.31, 'sad');

      var testFinishedTask = function (startPercentAfter, endPercentAfter, expectedStatus) {
        expect(new taskHelperService.Task("Task", startTime, endTime, moment(startTime).add(duration * startPercentAfter, 'seconds'), moment(endTime).add(duration * endPercentAfter, 'seconds')).status).toBe(expectedStatus);
      }

      //Test tasks with StartedOn time only
      testFinishedTask(-0.05, -0.25, 'happy');
      testFinishedTask(-0.05, 0, 'happy');
      testFinishedTask(-0.05, 0.09, 'content');
      testFinishedTask(-0.05, 0.10, 'content');
      testFinishedTask(-0.05, 0.11, 'unhappy');
      testFinishedTask(-0.05, 0.19, 'unhappy');
      testFinishedTask(-0.05, 0.21, 'sad');
    });
  })
});