const PeerjsCall = {
  peer_id: '',
  peer: {},
  getUserMedia: navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia,
  isAudio: false,
  isVideo: false,
  isConnecting: false,
  isConnected: false,
  allLocalStream: {

  },
  init: async function () {
    PeerjsCall.peer = await new Peer({
      host: PEERJS_URL,
      port: PEERJS_PORT,
      path: '/call',
      proxied: true
    });

    PeerjsCall.peer.on('open', function (id) {
      PeerjsCall.peer_id = id;
    });

    PeerjsCall.peer.on('call', function (call) {
      PeerjsCall.getUserMedia({ video: true, audio: true }, function (stream) {

        const peer_id = call.peer;
        PeerjsCall.allLocalStream[peer_id] = stream;
        stream.getTracks()[0].enabled = PeerjsCall.isAudio;
        stream.getTracks()[1].enabled = PeerjsCall.isVedio;

        let video;
        const videoHTML = document.querySelector(`.call-container video[data-peer_id="${peer_id}"]`);
        if (videoHTML) {
          video = videoHTML;
        } else {
          video = document.createElement('video');
          video.dataset.peer_id = peer_id;
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
  connect: async function () {
    // peer ready
    if (!PeerjsCall.peer.open) {
      return;
    }

    if (PeerjsCall.isConnected) {
      PeerjsCall.disconnect();
      return;
    }
    PeerjsCall.isConnected = true;

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

    socket.emit('join call room', JSON.stringify({
      room: Model.room.name,
      user_id: Model.user.id,
      peer_id: PeerjsCall.peer_id,
    }));

  },
  disconnect: function () {
    const peer_id = PeerjsCall.peer.id;
    socket.emit('leave call room', JSON.stringify({
      room: Model.room.name,
      user_id: Model.user.id,
      peer_id,
    }));
    // PeerjsCall.peer.destroy();

    // stop audio and video
    for (let peer_id in PeerjsCall.allLocalStream) {
      const stream = PeerjsCall.allLocalStream[peer_id];
      stream.getTracks().forEach(track => { track.stop(); });
    }
    PeerjsCall.allLocalStream = {};

    const callContainerHTML = document.querySelector('.call-container');
    callContainerHTML.innerHTML = `
      <video src="" width="200" height="150" class="self" muted></video>
    `;

    PeerjsCall.isConnected = false;
  },
  callAll: function (peer_ids) {
    for (let peer_idIndex = 0; peer_idIndex < peer_ids.length; peer_idIndex++) {

      PeerjsCall.getUserMedia({ video: true, audio: true }, function (stream) {
        const peer_id = peer_ids[peer_idIndex];
        PeerjsCall.allLocalStream[peer_id] = stream;
        stream.getTracks()[0].enabled = PeerjsCall.isAudio;
        stream.getTracks()[1].enabled = PeerjsCall.isVedio;

        let video;
        const videoHTML = document.querySelector(`.call-container video[data-peer_id="${peer_id}"]`);
        if (videoHTML) {
          video = videoHTML;
        } else {
          video = document.createElement('video');
          video.dataset.peer_id = peer_id;
          video.width = 200;
          video.height = 150;
          document.querySelector('.call-container').appendChild(video);
        }

        const call = PeerjsCall.peer.call(peer_id, stream);
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
  removeLeave: function (peer_id) {
    const videoHTML = document.querySelector(`.call-container video[data-peer_id="${peer_id}"]`);
    if (videoHTML) {
      videoHTML.remove();
    }

    const stream = PeerjsCall.allLocalStream[peer_id];
    if (stream) {
      stream.getTracks().forEach(track => { track.stop(); });
      delete PeerjsCall.allLocalStream[peer_id];
    }

  },
  waitCalling: async function () {
    get('.wait-call-spinner-container').classList.remove('hide');
    PeerjsCall.isConnecting = true;
    await delay(1500);
    get('.wait-call-spinner-container').classList.add('hide');
    PeerjsCall.isConnecting = false;
  },
  toggleAudio: function () {
    PeerjsCall.isAudio = !PeerjsCall.isAudio;
    for (let peer_id in PeerjsCall.allLocalStream) {
      const stream = PeerjsCall.allLocalStream[peer_id];
      stream.getTracks()[0].enabled = PeerjsCall.isAudio;
    }
  },
  toggleVedio: function () {
    PeerjsCall.isVedio = !PeerjsCall.isVedio;
    for (let peer_id in PeerjsCall.allLocalStream) {
      const stream = PeerjsCall.allLocalStream[peer_id];
      stream.getTracks()[1].enabled = PeerjsCall.isVedio;
    }
  },
};

PeerjsCall.init();