(() => {
  
  /**
   * WebRTCによるカメラアクセス
   */
  const video = document.getElementById('video')
  const canvas = document.getElementById('canvas')
  const ctx = canvas.getContext('2d')
  
  let isVideoRun = true
  let isLoadedMetaData = false
  let constraints = { audio: false, video: {facingMode: 'user'} }

  let detector = {}


  function start(){
    navigator.mediaDevices.getUserMedia( constraints )
      .then( mediaStrmSuccess )
      .catch( mediaStrmFailed )  
  }

  function mediaStrmSuccess( stream ){
    video.srcObject = stream

    // ウェブカムのサイズを取得し、canvasにも適用
    if(isLoadedMetaData) return
    isLoadedMetaData = true

    video.addEventListener('loadedmetadata', () => {
      video.width = video.videoWidth / 5
      video.height = video.videoHeight / 5
      canvas.width = video.videoWidth / 5
      canvas.height = video.videoHeight / 5

      detector.handfist = new objectdetect.detector(canvas.width, canvas.height, 1.1, objectdetect.handfist)
      detector.handopen = new objectdetect.detector(canvas.width, canvas.height, 1.1, objectdetect.handopen)

      requestAnimationFrame( draw )
    }, false)
  }

  function mediaStrmFailed( e ){
    console.log( e )
  }

  function stop(){
    let stream = video.srcObject
    let tracks = stream.getTracks()

    tracks.forEach( (track) => {
      track.stop()
    })
    video.srcObject = null
  }

  function draw(){
    if(isVideoRun){
      detectHand()
    }
    requestAnimationFrame( draw )
  }

  start()


  /**
   * ストリームのコントロール
   */
  const stopBtn = document.getElementById('stop')
  const frontBtn = document.getElementById('front')
  const rearBtn = document.getElementById('rear')

  let ua = navigator.userAgent
  if(ua.indexOf('iPhone') < 0 && ua.indexOf('Android') < 0 && ua.indexOf('Mobile') < 0 && ua.indexOf('iPad') < 0){
    frontBtn.disabled = true
    rearBtn.disabled = true
  }

  stopBtn.addEventListener('click', () => {
    if(isVideoRun){
      stop()
      stopBtn.textContent = 'START'
    }else{
      start()
      stopBtn.textContent = 'STOP'
    }
    isVideoRun = !isVideoRun
  }, false)

  frontBtn.addEventListener('click', () => {
    stop()
    constraints.video.facingMode = 'user'
    setTimeout( () => {
      start()
    }, 500)
  }, false)

  rearBtn.addEventListener('click', () => {
    stop()
    constraints.video.facingMode = 'environment'
    setTimeout( () => {
      start()
    }, 500)
  }, false)


  /**
   * 手の認識
   */
  const outputTxt = document.querySelector('.output_txt')

  function detectHand(){
    ctx.drawImage(video, 0, 0, video.width, video.height)

    let coords = {
      handfist: detector.handfist.detect(video, 1),
      // handopen: detector.handopen.detect(video, 1),
    }

    let pos_old

    for(let k in coords){
      if(coords[k][0]){
        let coord = coords[k][0]

        coord[0] *= video.videoWidth / detector[k].canvas.width
        coord[1] *= video.videoHeight / detector[k].canvas.height
        coord[2] *= video.videoWidth / detector[k].canvas.width
        coord[3] *= video.videoHeight / detector[k].canvas.height

        let pos = [coord[0] + coord[2] / 2, coord[1] + coord[3] / 2]

        if(pos_old){
          let dx = (pos[0] - pos_old[0]) / video.videoWidth
          let dy = (pos[1] - pos_old[1]) / video.videoHeight

          pos_old = pos
        }else if(coord[4] > 2){
          pos_old = pos
        }

        ctx.beginPath()
        ctx.lineWidth = 2
        if(k === 'handfist'){
          ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'
          // ctx.fillStyle = pos_old ? 'rgba(0, 255, 255, 0.5)': 'rgba(255, 0, 0, 0.5)'
          outputTxt.textContent = 'HandFist'
        }else{
          ctx.fillStyle = 'rgba(0, 255, 0, 0.5)'
          // ctx.fillStyle = pos_old ? 'rgba(0, 255, 0, 0.5)': 'rgba(255, 0, 0, 0.5)'
          outputTxt.textContent = 'HandOpen'
        }
        ctx.fillRect(
          coord[0] / video.videoWidth * canvas.clientWidth,
          coord[1] / video.videoHeight * canvas.clientHeight,
          coord[2] / video.videoWidth * canvas.clientWidth,
          coord[3] / video.videoHeight * canvas.clientHeight
        )
        ctx.stroke()
      }else{
        pos_old = null
        outputTxt.textContent = ''
      }
    }



  }



})()