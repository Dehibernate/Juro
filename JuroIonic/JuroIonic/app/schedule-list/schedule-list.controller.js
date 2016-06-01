angular.module('starter.controllers')
  .controller('ScheduleListCtrl', function ($scope, $ionicPopup, SchedulesService, moment) {
    $scope.schedules = [];

    SchedulesService.getAll().then((schedules) => {
      $scope.schedules = schedules;
      $scope.$digest();
    });

    //Monitor database for changes and update the schedules list if any occur
    $scope.$on('db-change', () => {
      SchedulesService.getAll().then((schedules) => {
        $scope.schedules = schedules;
        $scope.$digest();
      });
    });

    //Used for ordering the schedules on the GUI
    $scope.sort = (schedule) => -moment(schedule.date,'DD/MM/YYYY');

    $scope.addSchedule = () => {
      $ionicPopup.prompt({
        title: 'New Schedule',
        template: 'Please enter the schedule date',
        defaultText: new Date(),
        inputType: 'date',
        inputPlaceholder: 'Placehoder Text'
      }).then((date) => {
        if (date) {
          SchedulesService.addSchedule(moment(date), [])
            .catch((e) => {
              if (e.error && e.name == "conflict") {
                $ionicPopup.alert({
                  title: 'Error',
                  template: 'A schedule for this date already exists. Please choose a different date.'
                });
              } else {
                console.log("Error adding schedule ", e);
              }
            });
        }
      });
    };

    $scope.remove = (schedule) =>
      SchedulesService
        .removeSchedule(schedule)
        .catch(err => console.log(err));
  });
