import { Instance } from 'cooljs'
import { blockAction, blockPainter } from './block'
import {
  checkMoveDown,
  getMoveDownValue,
  drawYellowString,
  getAngleBase
} from './utils'
import { addFlight } from './flight'
import * as constant from './constant'




const resetGame = (engine) => {
  if(typeof YaGames == 'undefined'){
    startGameAfterAd(engine);
    return
  }
  YaGames.init().then(ysdk => {
    console.log('Yandex SDK initialized');
    window.ysdk = ysdk;
    ysdk.adv.showRewardedVideo({
      callbacks: {
        onOpen: () => {
          console.log('Video ad open. reward is:');
        },
        onRewarded: () => {
          console.log('Rewarded!');
          startGameAfterAd(engine);
        },
        onClose: () => {
          console.log('Video ad closed.');
          startGameAfterAd(engine); // Если досмотрел, продолжаем игру
        },
        onError: (e) => {
          console.log('Error while open video ad:', e);
        }
      }
    })
  });
}

const stopingGameReadyApi = () => {

  if(typeof YaGames === 'undefined'){
    return;
  }

  YaGames.init().then(ysdk => {
    console.log('Вызываю функция для остановки GameApi')
    window.ysdk = ysdk;
    if(ysdk.features.GameplayAPI){
      ysdk.features.GameplayAPI.stop();
    }else {
      console.log('Невозможно остановить GameplayAPI')
    }
  })


}

// Создаем наблюдателя для отслеживания изменений в DOM
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
      const element = document.getElementById('over-zero');
      const element2 = document.getElementById('startGame')
      if (element) {
        const style = window.getComputedStyle(element);
        if (style.display === 'block') {
          console.log('СТОП ИГРА!');
          stopingGameReadyApi()
        }
      }
      if (element2) {
        const style = window.getComputedStyle(element2);
        if (style.display === 'block') {
          console.log('СТОП ЕЩЕ НЕ НАЧАЛИ!');
          stopingGameReadyApi()
        }
      }
    }
  });
});

// Наблюдаем за изменениями в документе
observer.observe(document.body, { attributes: true, subtree: true });

const startGameAfterAd = (engine) => {
  // Получаем сохраненные значения
  const successCount = engine.getVariable(constant.successCount, 0)
  // const failedCount = engine.getVariable(constant.failedCount, 0)
  const gameScore = engine.getVariable(constant.gameScore, 0)
  const modal = document.getElementById('modal');

  modal.style.display = 'none';

  // engine.setVariable(constant.blockCount, 0)
  // engine.setVariable(constant.initialAngle, 0)
  engine.setVariable(constant.gameStartNow, true)
  engine.setVariable(constant.failedCount, 1)

  // Восстанавливаем состояния
  engine.setVariable(constant.successCount, successCount)
  // engine.setVariable(constant.failedCount, failedCount)
  engine.setVariable(constant.gameScore, gameScore)

  // Запускаем анимацию
  startAnimate(engine)
}




export const endAnimate = (engine) => {

  const gameStartNow = engine.getVariable(constant.gameStartNow)
  if (!gameStartNow) {
    return
  }

  const successCount = engine.getVariable(constant.successCount, 0)
  let failedCount = engine.getVariable(constant.failedCount)
  const gameScore = engine.getVariable(constant.gameScore, 0)
  const threeFiguresOffset = Number(successCount) > 99 ? engine.width * 0.1 : 0;

  const inviteButton = document.querySelector('.js-invite');

  let restartCount = 0;

  inviteButton.addEventListener('click', function() {
    if (restartCount < 1){
      resetGame(engine);
      restartCount++;
    } else {
      inviteButton.style.display = "none";
    }
  });

  drawYellowString(engine, {
    string: 'Этаж',
    size: engine.width * 0.06,
    x: (engine.width * 0.24) + threeFiguresOffset,
    y: engine.width * 0.12,
    textAlign: 'left',
    fontName: 'Arial',
    fontWeight: 'bold'
  })
  drawYellowString(engine, {
    string: successCount,
    size: engine.width * 0.17,
    x: (engine.width * 0.22) + threeFiguresOffset,
    y: engine.width * 0.2,
    textAlign: 'right'
  })
  const score = engine.getImg('score')
  const scoreWidth = score.width
  const scoreHeight = score.height
  const zoomedWidth = engine.width * 0.35
  const zoomedHeight = (scoreHeight * zoomedWidth) / scoreWidth
  engine.ctx.drawImage(
    score,
    engine.width * 0.61,
    engine.width * 0.038,
    zoomedWidth,
    zoomedHeight
  )
  drawYellowString(engine, {
    string: gameScore,
    size: engine.width * 0.06,
    x: engine.width * 0.9,
    y: engine.width * 0.11,
    textAlign: 'right'
  })
  const { ctx } = engine
  const heart = engine.getImg('heart')
  const heartWidth = heart.width
  const heartHeight = heart.height
  const zoomedHeartWidth = engine.width * 0.08
  const zoomedHeartHeight = (heartHeight * zoomedHeartWidth) / heartWidth
  for (let i = 1; i <= 3; i += 1) {
    ctx.save()
    if (i <= failedCount) {
      ctx.globalAlpha = 0.2
    }
    ctx.drawImage(
      heart,
      (engine.width * 0.66) + ((i - 1) * zoomedHeartWidth),
      engine.width * 0.16,
      zoomedHeartWidth,
      zoomedHeartHeight
    )
    ctx.restore()
  }
}



export const startAnimate = (engine) => {
  const gameStartNow = engine.getVariable(constant.gameStartNow)
  if (!gameStartNow) return;

  const lastBlock = engine.getInstance(`block_${engine.getVariable(constant.blockCount)}`)
  if (!lastBlock || [constant.land, constant.out].indexOf(lastBlock.status) > -1) {
    if (checkMoveDown(engine) && getMoveDownValue(engine)) return
    if (engine.checkTimeMovement(constant.hookUpMovement)) return
    const angleBase = getAngleBase(engine)
    const initialAngle = (Math.PI
        * engine.utils.random(angleBase, angleBase + 5)
        * engine.utils.randomPositiveNegative()
    ) / 180
    engine.setVariable(constant.blockCount, engine.getVariable(constant.blockCount) + 1)
    engine.setVariable(constant.initialAngle, initialAngle)
    engine.setTimeMovement(constant.hookDownMovement, 500)
    const block = new Instance({
      name: `block_${engine.getVariable(constant.blockCount)}`,
      action: blockAction,
      painter: blockPainter
    })
    engine.addInstance(block)
  }
  const successCount = Number(engine.getVariable(constant.successCount, 0))
  switch (successCount) {
    case 2:
      addFlight(engine, 1, 'leftToRight')
      break
    case 6:
      addFlight(engine, 2, 'rightToLeft')
      break
    case 8:
      addFlight(engine, 3, 'leftToRight')
      break
    case 14:
      addFlight(engine, 4, 'bottomToTop')
      break
    case 18:
      addFlight(engine, 5, 'bottomToTop')
      break
    case 22:
      addFlight(engine, 6, 'bottomToTop')
      break
    case 25:
      addFlight(engine, 7, 'rightTopToLeft')
      break
    default:
      break
  }
}



