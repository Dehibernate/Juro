// Ionic Starter App
// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in authentication.controller.js
angular.module('starter', ['ionic', 'starter.controllers', 'starter.services', 'angularMoment','superlogin'])
  .run(function ($ionicPlatform) {
    console.log("Starting application...");
    $ionicPlatform.ready(function () {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      console.log("Platform ready. Disabling keyboard for Windows 10...");
      if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
        // Check reference to avoid runtime error on windows 10
        if (window.cordova.plugins.Keyboard.hideKeyboardAccessoryBar) {
          cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        cordova.plugins.Keyboard.disableScroll(true);
      }

      if (window.StatusBar) {
        // org.apache.cordova.statusbar required
        StatusBar.styleDefault();
      }
    });
  })
  .config(function ($stateProvider, $urlRouterProvider,superloginProvider) {
    
    //MAKE SURE THE ADDRESS BELOW POINTS TO THE JURO SERVER
    var conf ={
      baseUrl: 'http://localhost:3000',
      storage: 'local',
      endpoints: ['localhost:3000'],
      noDefaultEndpoint: true
    };

    superloginProvider.configure(conf);

    $stateProvider
      .state('login', {
        url: '/login',
        cache: false,
        templateUrl: 'src/authentication/authentication.html',
        controller: 'AuthCtrl'
      })
      .state('tab', {
        url: '/tab',
        abstract: true,
        templateUrl: 'src/tabs.html'
      })
      .state('task-edit', {
        url: '/task-edit',
        cache: false,
        templateUrl: 'src/task-list/edit-task.html',
        controller: 'EditTaskCtrl',
        params: {
          task: null,
          schedule_id: null
        }
      })
      .state('tab.today', {
        url: '/today',
        cache: false,
        views: {
          'tab-tasks': {
            templateUrl: 'src/task-list/task-list.html',
            controller: 'TaskListCtrl'
          }
        }
      })

      .state('tab.schedules', {
        url: '/schedule-list',
        cache: false,
        views: {
          'tab-schedules': {
            templateUrl: 'src/schedule-list/schedule-list.html',
            controller: 'ScheduleListCtrl'
          }
        }
      })

      .state('tab.tasks', {
        url: '/schedule-list/:date',
        cache: false,
        views: {
          'tab-schedules': {
            templateUrl: 'src/task-list/task-list.html',
            controller: 'TaskListCtrl'
          }
        }
      })
      .state('tab.settings', {
        url: '/settings',
        views: {
          'tab-settings': {
            templateUrl: 'src/settings/settings.html',
            controller: 'SettingsCtrl'
          }
        }
      });

    $urlRouterProvider.otherwise('/login');
  });
