function parseValidationErrors(err) {
  if (!err.validationErrors) return err.error;

  var str = '';
  var errors = _.union(err.validationErrors.email, err.validationErrors.password, err.validationErrors.username);
  for (var i = 0; i < errors.length; i++)
    str += '- ' + errors[i] + '<br>';

  return str;
}

angular.module('starter.controllers')
.controller('AuthCtrl', function ($scope, AuthService, $ionicPopup, $ionicHistory) {
  $scope.$on('$ionicView.enter', () => $ionicHistory.clearHistory());

  //After navigating to the authentication page, prevent the user from going back
  $ionicHistory.nextViewOptions({
    disableAnimate: true,
    disableBack: true
  });

  $scope.authType = 'signup';
  $scope.verifyEmail = email => /^(.)*@(.)+\.[a-z]+$/.test(email);

  $scope.login = (username, password) => {
    AuthService.login(username, password)
    .catch(data=> $ionicPopup.alert({
      template: data ? data.message : "Error",
      title: data ? data.error : "Could not connect to server"
    }));
  };

  $scope.signup = (username, email, password, confirmPassword) => {
    AuthService.signup(username, email, password, confirmPassword)
    .then(() => $ionicPopup.alert({
      template: 'Your account was successfully created and a verification link has been sent to your email. ' +
      '<br>Please verify your account before logging in.',
      title: "Registration"
    }))
    .catch((data) => {
      $ionicPopup.alert({
        title: data ? data.error : "Error",
        template: data ? parseValidationErrors(data) : "Could not connect to server"
      });
    });
  };

  $scope.forgotPassword = () => {
    //Declare a new scope to be used for the verifyEmailPopup
    var verifyEmailScope = $scope.$new(true);
    verifyEmailScope.data = {};
    verifyEmailScope.verifyEmail = $scope.verifyEmail;

    //Show a prompt for the user's email
    var verifyEmailPopup = $ionicPopup.prompt({
      scope: verifyEmailScope,
      title: 'Password Recovery',
      templateUrl:'src/authentication/forgot-password.html',
      buttons: [
      {
        text: 'Cancel', type: 'button-positive button-small'
      },
      {
        text: 'Skip', type: 'button-positive button-small', active: false,
        onTap: () => {
          verifyEmailScope.data.skip = true;
          return verifyEmailScope.data;
        }
      },
      {
        text: 'Send', type: 'button-positive button-small',
        onTap: (e) => {
          verifyEmailScope.showError = !verifyEmailScope.verifyEmail(verifyEmailScope.data.email);
          return verifyEmailScope.showError ? e.preventDefault() : verifyEmailScope.data;
        }
      }]
    });

    //If the email was valid, show the password reset popup, asking for tje reset token and the new password
    verifyEmailPopup.then((data) => {
      if (!data) return;

      function showResetPopup() {
        var resetPopupScope = $scope.$new(true);
        resetPopupScope.data = {};

        var resetPopup = $ionicPopup.prompt({
          scope: resetPopupScope,
          title: 'Reset Password',
          templateUrl: 'src/authentication/reset-password.html',
          buttons: [
          {text: 'Cancel', type: 'button-positive'},
          {
            text: 'OK',
            type: 'button-positive',
            onTap: function (e) {
              if (!resetPopupScope.data.token || !resetPopupScope.data.password || !resetPopupScope.data.confirmPassword)
                resetPopupScope.error = 'Please fill out all the fields';
              else if (resetPopupScope.data.password != resetPopupScope.data.confirmPassword)
                resetPopupScope.error = 'Passwords do not match';
              else
                resetPopupScope.error = undefined;

              return resetPopupScope.error ? e.preventDefault() : resetPopupScope.data;
            }
          }]
        });

        resetPopup
        .then(data=> {
          if (!data) return;

          AuthService.resetPassword(data.token, data.password, data.confirmPassword)
          .then(x=> $ionicPopup.alert({title: "Success", template: "Your password has successfully been reset"}))
          .catch(err=> $ionicPopup.alert({
            title: err ? err.error : "Error",
            template: err ? parseValidationErrors(err) : "Could not connect to server"
          }));
        });

        resetPopup
        .catch(err=>
          $ionicPopup.alert({
            title: "Error",
            template: err && err.error ? err.error : "Could not connect to server"
          }));
      }

      if (!data.skip && data.email) {
        AuthService.forgotPassword(data.email)
        .then(()=>showResetPopup())
        .catch(err=> $ionicPopup.alert({
          title: "Error",
          template: err && err.error ? err.error : "Could not connect to server"
        }));
      }else{
        showResetPopup();
      }
    });
  }
});
