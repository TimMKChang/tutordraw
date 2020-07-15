const PeerjsCall = {
  peer_id: '',
  peer: '',
  getUserMedia: navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia,
  isAudio: false,
  isVideo: false,
  allLocalStream: {

  },
  connect: function () {
    if (PeerjsCall.peer.open) {
      PeerjsCall.disconnect();
      return;
    }

    // const user_id = Math.random().toString(16).substr(-8);
    const user_id = Model.user.id.toString();
    PeerjsCall.peer_id = user_id;

    PeerjsCall.peer = new Peer(user_id, {
      host: PEERJS_URL,
      port: PEERJS_PORT,
      path: '/call',
      proxied: true
    });

    socket.emit('join call room', JSON.stringify({
      room: Model.room.name,
      user_id,
    }));

    PeerjsCall.peer.on('disconnected', function () {
      socket.emit('leave call room', JSON.stringify({
        room: Model.room.name,
        user_id: PeerjsCall.peer_id,
      }));

      const callContainerHTML = document.querySelector('.call-container');
      callContainerHTML.innerHTML = '';
    });

    PeerjsCall.peer.on('call', function (call) {
      PeerjsCall.getUserMedia({ video: true, audio: true }, function (stream) {

        const callUserId = call.peer;
        PeerjsCall.allLocalStream[callUserId] = stream;
        stream.getTracks()[0].enabled = PeerjsCall.isAudio;
        stream.getTracks()[1].enabled = PeerjsCall.isVedio;

        let video;
        const videoHTML = document.querySelector(`.call-container video[data-call-user-id="${callUserId}"]`);
        if (videoHTML) {
          video = videoHTML;
        } else {
          video = document.createElement('video');
          video.dataset.callUserId = callUserId;
          video.width = 200;
          video.height = 150;
          document.querySelector('.call-container').appendChild(video);
        }

        call.answer(stream); // Answer the call with an A/V stream.
        call.on('stream', function (remoteStream) {
          video.srcObject = remoteStream;
          video.onloadedmetadata = function (e) {
            video.play();
          };
        });
      }, function (err) {
        console.log('Failed to get local stream', err);
      });
    });

  },
  disconnect: function () {
    const user_id = PeerjsCall.peer.id;
    socket.emit('leave call room', JSON.stringify({
      room: Model.room.name,
      user_id,
    }));
    PeerjsCall.peer.destroy();

    // stop audio and video
    for (let user_id in PeerjsCall.allLocalStream) {
      const stream = PeerjsCall.allLocalStream[user_id];
      stream.getTracks().forEach(track => { track.stop(); });
    }
  },
  callAll: function (usersInCall) {
    for (let userIndex = 0; userIndex < usersInCall.length; userIndex++) {
      const callUserId = usersInCall[userIndex];

      let video;
      if (document.querySelector(`.call-container video[data-call-user-id="${callUserId}"]`)) {
        video = document.querySelector(`.call-container video[data-call-user-id="${callUserId}"]`);
      } else {
        video = document.createElement('video');
        video.dataset.callUserId = callUserId;
        video.width = 200;
        video.height = 150;
        document.querySelector('.call-container').appendChild(video);
      }

      PeerjsCall.getUserMedia({ video: true, audio: true }, function (stream) {
        PeerjsCall.allLocalStream[callUserId] = stream;
        stream.getTracks()[0].enabled = PeerjsCall.isAudio;
        stream.getTracks()[1].enabled = PeerjsCall.isVedio;

        const call = PeerjsCall.peer.call(callUserId, stream);
        call.on('stream', function (remoteStream) {
          video.srcObject = remoteStream;
          video.onloadedmetadata = function (e) {
            video.play();
          };
        });
      }, function (err) {
        console.log('Failed to get local stream', err);
      });
    }
  },
  toggleAudio: function () {
    PeerjsCall.isAudio = !PeerjsCall.isAudio;
    for (let user_id in PeerjsCall.allLocalStream) {
      const stream = PeerjsCall.allLocalStream[user_id];
      stream.getTracks()[0].enabled = PeerjsCall.isAudio;
    }
  },
  toggleVedio: function () {
    PeerjsCall.isVedio = !PeerjsCall.isVedio;
    for (let user_id in PeerjsCall.allLocalStream) {
      const stream = PeerjsCall.allLocalStream[user_id];
      stream.getTracks()[1].enabled = PeerjsCall.isVedio;
    }
  },
};