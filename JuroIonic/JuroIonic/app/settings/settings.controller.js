angular.module('starter.controllers')
  .controller('SettingsCtrl', function ($scope, $ionicPopup, $state, DBService, AuthService) {

    $scope.$on('$ionicView.enter', () => {
      $scope.user = DBService.getUser();
      $scope.dbAdapter = DBService.getDBAdapter();
    });

    $scope.logout = () => {
      AuthService.logout()
        .catch(data => {
          console.log(data);
          $ionicPopup.alert({ template: "Error logging out" });
        });

      $state.go("login");
    };

    $scope.logoutAll = () => {
      $ionicPopup.confirm({
        title: 'Secure Logout',
        template: 'This action will log out this and all other connected devices. Are you sure?'
      }).then(res => {
        if (res) {
          AuthService.logoutAll()
            .catch(data => {
              console.log(data);
              $ionicPopup.alert({ template: "Error logging out" });
            });
        }
      });
    };
  });
