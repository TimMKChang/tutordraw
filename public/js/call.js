const PeerjsCall = {
  peer_id: '',
  peer: '',
  getUserMedia: navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia,
  isAudio: false,
  isVideo: false,
  isConnecting: false,
  allLocalStream: {

  },
  connect: async function () {
    if (PeerjsCall.peer.open) {
      PeerjsCall.disconnect();
      return;
    }

    await PeerjsCall.waitCalling();

    PeerjsCall.getUserMedia({ video: true, audio: true }, function (stream) {
      PeerjsCall.allLocalStream.self = stream;
      stream.getTracks()[0].enabled = PeerjsCall.isAudio;
      stream.getTracks()[1].enabled = PeerjsCall.isVedio;

      const video = document.querySelector('.call-container video.self');
      video.srcObject = stream;
      video.onloadedmetadata = function (e) {
        video.play();
      };
    }, function (err) {
      console.log('Failed to get local stream', err);
    });

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
    PeerjsCall.allLocalStream = {};

    const callContainerHTML = document.querySelector('.call-container');
    callContainerHTML.innerHTML = `
      <video src="" width="200" height="150" class="self" muted></video>
    `;
  },
  callAll: function (usersInCall) {
    for (let userIndex = 0; userIndex < usersInCall.length; userIndex++) {

      PeerjsCall.getUserMedia({ video: true, audio: true }, function (stream) {
        const callUserId = usersInCall[userIndex];
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
  removeLeave: function (user_id) {
    const videoHTML = document.querySelector(`.call-container video[data-call-user-id="${user_id}"]`);
    if (videoHTML) {
      videoHTML.remove();
    }

    const stream = PeerjsCall.allLocalStream[user_id];
    if (stream) {
      console.log(stream);
      stream.getTracks().forEach(track => { track.stop(); });
      delete PeerjsCall.allLocalStream[user_id];
    }

  },
  waitCalling: async function () {
    get('.wait-call-spinner-container').classList.remove('hide');
    PeerjsCall.isConnecting = true;
    await delay(3000);
    get('.wait-call-spinner-container').classList.add('hide');
    PeerjsCall.isConnecting = false;
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