import React, { Component } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
  AsyncStorage
} from 'react-native'

const LoginView = Platform.select({
  ios: () => KeyboardAvoidingView,
  android: () => View,
})();

import Button from '../components/button'
import SendBird from 'sendbird'
var sb = null;

export default class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      userId: '',
      username: '',
      connectLabel: 'CONNECT',
      connected: false,
      buttonDisabled: false,
      errorMessage: ''
    };
    this._onPressConnect = this._onPressConnect.bind(this);
    this._onPressOpenChannel = this._onPressOpenChannel.bind(this);
    this._onPressGroupChannel = this._onPressGroupChannel.bind(this)
  }

  componentWillMount() {
    AsyncStorage.multiGet(['userId', 'username']).then((data) => {
      console.log(data);
      if(data[0][1] && data[1][1]) {
        this.setState({
          userId: data[0][1],
          username: data[1][1]
        })
        this._connect();
      }
    });
  }

  _onPressConnect() {
    Keyboard.dismiss();

    if (this.state.connected) {
      this._onPressDisconnect();
      return;
    }

    if (this.state.username.trim().length == 0 || this.state.userId.trim().length == 0) {
      this.setState({
        userId: '',
        username: '',
        errorMessage: 'User ID and Nickname must be required.'
      });
      return;
    }

    var regExp = /[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi
    if (regExp.test(this.state.username) || regExp.test(this.state.userId)) {
      this.setState({
        userId: '',
        username: '',
        errorMessage: 'Please only alphanumeric characters.'
      });
      return;
    }
    this._connect();
  }

  _connect() {
    this.setState({
      buttonDisabled: true,
      connectLabel: 'CONNECTING...'
    });
    sb = SendBird.getInstance();
    var _SELF = this;
    sb.connect(_SELF.state.userId, function (user, error) {
      if (error) {
        _SELF.setState({
          userId: '',
          username: '',
          errorMessage: 'Login Error',
          buttonDisabled: false
        });
        console.log(error);
        return;
      }

      if (Platform.OS === 'ios') {
        if (sb.getPendingAPNSToken()){
          sb.registerAPNSPushTokenForCurrentUser(sb.getPendingAPNSToken(), function(result, error){
            console.log("APNS TOKEN REGISTER AFTER LOGIN");
            console.log(result);
          });
        }
      } else {
        if (sb.getPendingGCMToken()){
          sb.registerGCMPushTokenForCurrentUser(sb.getPendingGCMToken(), function(result, error){
            console.log("GCM TOKEN REGISTER AFTER LOGIN");
            console.log(result);
          });
        }
      }
      user.createMetaData({
        company: '31T'
      }, function (response, error) {
        if (error) {
          console.log(error);
          return;
        }
      });
      sb.updateCurrentUserInfo(_SELF.state.username, '', function(response, error) {
        _SELF.setState({
          buttonDisabled: false,
          connected: true,
          connectLabel: 'DISCONNECT',
          errorMessage: ''
        });
      });
      AsyncStorage.multiSet([['userId', _SELF.state.userId], ['username', _SELF.state.username]], cb => {
        console.log(cb);
      });
      _SELF.props.navigator.push({name: 'groupChannel'});
    });
  }

  _onPressOpenChannel() {
    this.props.navigator.push({name: 'openChannel'});
  }

  _onPressGroupChannel() {
    this.props.navigator.push({name: 'groupChannel'});
  }

  _onPressDisconnect() {
    sb.disconnect();
    AsyncStorage.multiRemove(['userId', 'username']);
    this.setState({
      userId: '',
      username: '',
      errorMessage: '',
      connected: false,
      connectLabel: 'CONNECT'
    });
  }

  _buttonStyle() {
    return {
      backgroundColor: '#f46b40',
      underlayColor: '#51437f',
      borderColor: '#f46b40',
      disabledColor: '#ababab',
      textColor: '#ffffff'
    }
  }

  render() {
    return (
      <LoginView behavior='padding' style={styles.container} >
        <View style={styles.loginContainer}>
          <TextInput
            style={styles.input}
            underlineColorAndroid={'transparent'}
            value={this.state.userId}
            onChangeText={(text) => this.setState({userId: text})}
            onSubmitEditing={Keyboard.dismiss}
            placeholder={'Enter Employee ID'}
            maxLength={12}
            multiline={false}
            />
          <TextInput
            style={[styles.input, {marginTop: 10}]}
            underlineColorAndroid={'transparent'}
            value={this.state.username}
            onChangeText={(text) => this.setState({username: text})}
            onSubmitEditing={Keyboard.dismiss}
            placeholder={'Create Chat Username'}
            maxLength={12}
            multiline={false}
            />

          <Button
            text={this.state.connectLabel}
            disabled={this.state.buttonDisabled}
            style={this._buttonStyle()}
            onPress={this._onPressConnect}
          />

          <Text style={styles.errorLabel}>{this.state.errorMessage}</Text>
        </View>
      </LoginView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loginContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1
  },
  input: {
    width: 250,
    color: '#555555',
    padding: 10,
    height: 50,
    borderColor: '#409ddb',
    borderWidth: 1,
    borderRadius: 4,
    alignSelf: 'center',
    backgroundColor: '#ffffff'
  },
  errorLabel: {
    color: '#ff0200',
    fontSize: 13,
    marginTop: 10,
    width: 250
  }
});
