const categories = [
  { label: 'Pop', term: 'pop' },
  { label: 'Rock', term: 'rock' },
  { label: 'Jazz', term: 'jazz' },
  { label: 'Classical', term: 'classical' },
  { label: 'Hip Hop', term: 'hip hop' },
  { label: 'Disco', term: 'disco' },
  { label: 'Movies', term: 'movie' },
  { label: 'Games', term: 'game' },
  { label: 'Anime', term: 'anime' },
  { label: 'Lo-fi', term: 'lofi' },
  { label: 'Country', term: 'country' },
  { label: 'Nina Chuba', term: 'nina chuba' },
  { label: 'ქართულები', term: 'georgian music' },
];

const categoryButtons = document.getElementById('categoryButtons');
const customCategoryInput = document.getElementById('customCategoryInput');
const customCategoryButton = document.getElementById('customCategoryButton');
const selectionSection = document.getElementById('selectionSection');
const gameSection = document.getElementById('gameSection');
const statusMessage = document.getElementById('statusMessage');
const roundLabel = document.getElementById('roundLabel');
const scoreLabel = document.getElementById('scoreLabel');
const answerButtons = document.getElementById('answerButtons');
const gameHeader = document.getElementById('gameHeader');
const gameContent = document.getElementById('gameContent');
const gameStatusMessage = document.getElementById('gameStatusMessage');
const feedbackDialog = document.getElementById('feedbackDialog');
const feedbackEmoji = document.getElementById('feedbackEmoji');
const feedbackLabel = document.getElementById('feedbackLabel');
const correctSongInfo = document.getElementById('correctSongInfo');
const nextButton = document.getElementById('nextButton');
const loadingOverlay = document.getElementById('loadingOverlay');
const toggleButton = document.getElementById('toggleButton');
const restartButton = document.getElementById('restartButton');
const backButton = document.getElementById('backButton');
const audioPlayer = document.getElementById('audioPlayer');
const resultsSection = document.getElementById('resultsSection');
const resultsEmoji = document.getElementById('resultsEmoji');
const resultsScore = document.getElementById('resultsScore');
const resultsCorrectCount = document.getElementById('resultsCorrectCount');
  const resultsIncorrectCount = document.getElementById('resultsIncorrectCount');
const resultsCategory = document.getElementById('resultsCategory');
const resultsTime = document.getElementById('resultsTime');
const restartGameButton = document.getElementById('restartGameButton');
const backToMenuButton = document.getElementById('backToMenuButton');
const categoryBadge = document.getElementById('categoryBadge');

let songs = [];
let rounds = [];
let currentRoundIndex = 0;
let score = 0;
let lastCategory = null;
let currentQuestion = null;
let nextRoundTimer = null;
let feedbackTimer = null;
let feedbackCountdownValue = 3;
let isAudioPlaying = false;
let gameStartTime = null;

function renderCategories() {
  const wrapper = categoryButtons.querySelector('.custom-category-wrapper');

  categoryButtons.querySelectorAll('button:not(.custom-category-button)').forEach((btn) => btn.remove());

  categories.forEach((category) => {
    const button = document.createElement('button');
    button.textContent = category.label;
    button.addEventListener('click', () => startGame(category));
    categoryButtons.insertBefore(button, wrapper);
  });
}

function setStatus(text) {
  statusMessage.textContent = text;
  statusMessage.classList.remove('status-error');
}

function showError(text) {
  statusMessage.textContent = text;
  statusMessage.classList.add('status-error');
}

function hideError() {
  statusMessage.textContent = '';
  statusMessage.classList.remove('status-error');
}

function resetGameState() {
  clearTimeout(nextRoundTimer);
  clearTimeout(feedbackTimer);
  feedbackCountdownValue = 3;
  score = 0;
  currentRoundIndex = 0;
  rounds = [];
  currentQuestion = null;
  scoreLabel.textContent = '0';
  roundLabel.textContent = '0 / 10';
  hideFeedbackDialog();
  answerButtons.innerHTML = '';
  gameHeader.classList.add('hidden');
  gameContent.classList.add('hidden');
  gameStatusMessage.classList.add('hidden');
  gameStatusMessage.textContent = '';
  gameSection.classList.add('hidden');
  selectionSection.classList.remove('hidden');
  resultsSection.classList.add('hidden');
  categoryBadge.classList.add('hidden');
  audioPlayer.pause();
  audioPlayer.src = '';
  audioPlayer.load();
  setPlaybackButtonState(false);
  stopVisualizer();
  gameStartTime = null;
}

function showSelectionScreen() {
  selectionSection.classList.remove('hidden');
  gameSection.classList.add('hidden');
  resetGameState();
  setStatus('');
  history.replaceState(null, '', window.location.pathname);
}

function showGameError(message) {
  gameContent.classList.add('hidden');
  gameStatusMessage.classList.remove('hidden');
  gameStatusMessage.textContent = message;
}

function clearGameError() {
  gameStatusMessage.classList.add('hidden');
  gameStatusMessage.textContent = '';
}

function handleCustomCategory() {
  const value = customCategoryInput.value.trim();

  if (!value) {
    setStatus('Enter a category name.');
    return;
  }

  startGame({ label: value, term: value });
}

function showLoading() {
  loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
  loadingOverlay.classList.add('hidden');
}

function setPlaybackButtonState(isPlaying) {
  isAudioPlaying = isPlaying;
  toggleButton.querySelector('.btn-icon').textContent = isPlaying ? '⏸' : '▶';
  toggleButton.classList.toggle('is-playing', isPlaying);
}

function showFeedbackDialog(isCorrect) {
  feedbackEmoji.textContent = isCorrect ? '🎉' : '❌';

  if (isCorrect) {
    feedbackLabel.textContent = 'Correct';
    feedbackLabel.className = 'feedback-label feedback-label-correct';
    correctSongInfo.innerHTML = '';
    feedbackEmoji.classList.add('feedback-emoji-large');
  } else {
    feedbackLabel.textContent = 'Wrong';
    feedbackLabel.className = 'feedback-label feedback-label-wrong';
    correctSongInfo.innerHTML = `
      <img src="${currentQuestion.correctSong.artworkUrl60 || currentQuestion.correctSong.artworkUrl100 || ''}" alt="${currentQuestion.correctSong.trackName}" />
      <div>
        <strong>${currentQuestion.correctSong.trackName}</strong>
        <span>${currentQuestion.correctSong.artistName}</span>
      </div>
    `;
    feedbackEmoji.classList.remove('feedback-emoji-large');
  }

  nextButton.textContent = `Next (${feedbackCountdownValue})`;
  feedbackDialog.classList.remove('hidden');
}

function hideFeedbackDialog() {
  feedbackDialog.classList.add('hidden');
  nextButton.textContent = 'Next';
  feedbackLabel.textContent = '';
  correctSongInfo.innerHTML = '';
}

function startFeedbackCountdown() {
  clearTimeout(feedbackTimer);
  feedbackCountdownValue = 3;
  nextButton.textContent = `Next (${feedbackCountdownValue})`;

  feedbackTimer = setInterval(() => {
    feedbackCountdownValue -= 1;
    nextButton.textContent = `Next (${feedbackCountdownValue})`;

    if (feedbackCountdownValue <= 0) {
      clearInterval(feedbackTimer);
      hideFeedbackDialog();
      currentRoundIndex += 1;
      showRound();
    }
  }, 1000);
}

async function startGame(category) {
  resetGameState();
  lastCategory = category;
  const urlParam = new URLSearchParams(window.location.search);
  if (urlParam.get('category') !== category.label) {
    const newUrl = `${window.location.pathname}?category=${encodeURIComponent(category.label)}`;
    history.pushState({ category: category.label }, '', newUrl);
  }
  selectionSection.classList.remove('hidden');
  gameSection.classList.add('hidden');
  resultsSection.classList.add('hidden');
  showLoading();
  hideError();

  try {
    songs = await fetchSongs(category.term);
    hideLoading();

    if (songs.length < 3) {
      showError('Songs not found.');
      return;
    }

    clearGameError();
    rounds = buildRounds(songs, 10);
    selectionSection.classList.add('hidden');
    gameSection.classList.remove('hidden');
    categoryBadge.textContent = lastCategory.label;
    categoryBadge.classList.remove('hidden');
    gameStartTime = Date.now();
    showRound();
  } catch (error) {
    hideLoading();
    console.error(error);
    showError('Failed to load songs. Please try again.');
  }
}

async function fetchSongs(term) {
  const collected = [];
  const seenIds = new Set();
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=200&media=music`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }

  const data = await response.json();
  const results = data.results || [];

  results.forEach((song) => {
    const trackId = song.trackId;
    const hasPreview = Boolean(song.previewUrl);
    const trackName = song.trackName || song.collectionName || 'Untitled track';

    if (!hasPreview || !trackId || seenIds.has(trackId)) {
      return;
    }

    seenIds.add(trackId);
    collected.push({
      trackId,
      trackName,
      artistName: song.artistName || 'Unknown artist',
      previewUrl: song.previewUrl,
      collectionName: song.collectionName || '',
      artworkUrl60: song.artworkUrl60 || '',
      artworkUrl100: song.artworkUrl100 || song.artworkUrl60 || ''
    });
  });

  return shuffleArray(collected);
}

function buildRounds(allSongs, count) {
  const correctSongs = shuffleArray([...allSongs]).slice(0, count);
  const usedIds = new Set(correctSongs.map((s) => s.trackId));

  return correctSongs.map((correctSong) => {
    const wrongChoices = shuffleArray(
      allSongs.filter((song) => !usedIds.has(song.trackId))
    ).slice(0, 3);

    wrongChoices.forEach((s) => usedIds.add(s.trackId));

    const options = shuffleArray([correctSong, ...wrongChoices]);

    return {
      correctSong,
      options
    };
  });
}

function showRound() {
  if (currentRoundIndex >= rounds.length) {
    finishGame();
    return;
  }

  currentQuestion = rounds[currentRoundIndex];
  roundLabel.textContent = `${currentRoundIndex + 1} / ${rounds.length}`;
  scoreLabel.textContent = score.toString();
  answerButtons.innerHTML = '';
  gameHeader.classList.remove('hidden');
  gameContent.classList.remove('hidden');
  clearGameError();

  currentQuestion.options.forEach((option, index) => {
    const button = document.createElement('button');
    button.innerHTML = `
      <span class="answer-shortcut">${index + 1}</span>
      <img src="${option.artworkUrl60 || option.artworkUrl100 || ''}" alt="${option.trackName}" />
      <span>${option.trackName} — ${option.artistName}</span>
    `;
    button.addEventListener('click', () => handleAnswer(option));
    answerButtons.appendChild(button);
  });

  audioPlayer.pause();
  audioPlayer.src = currentQuestion.correctSong.previewUrl;
  audioPlayer.load();
  audioPlayer.play().catch(() => {
    setStatus('Preview is unavailable for this song.');
  });
  setPlaybackButtonState(true);
  restartButton.disabled = false;
  toggleButton.disabled = false;
}

function togglePlayback() {
  if (!currentQuestion) {
    return;
  }

  if (!audioPlayer.src) {
    audioPlayer.src = currentQuestion.correctSong.previewUrl;
  }

  if (audioPlayer.paused) {
    audioPlayer.play().catch(() => {
      setStatus('Preview is unavailable for this song.');
    });
  } else {
    audioPlayer.pause();
  }
}

function restartPreview() {
  if (!currentQuestion) {
    return;
  }

  audioPlayer.currentTime = 0;
  audioPlayer.play().catch(() => {
    setStatus('Preview is unavailable for this song.');
  });
}

function handleAnswer(selectedOption) {
  if (!currentQuestion) {
    return;
  }

  audioPlayer.pause();

  const buttons = Array.from(answerButtons.querySelectorAll('button'));
  const isCorrect = selectedOption.trackId === currentQuestion.correctSong.trackId;

  buttons.forEach((button) => {
    const optionText = button.textContent;
    const optionTrackName = optionText.split(' — ')[0];
    const matchingOption = currentQuestion.options.find((option) => option.trackName === optionTrackName);

    if (matchingOption && matchingOption.trackId === currentQuestion.correctSong.trackId) {
      button.classList.add('correct');
    } else if (matchingOption && matchingOption.trackId === selectedOption.trackId && !isCorrect) {
      button.classList.add('incorrect');
    }

    button.disabled = true;
  });

  if (isCorrect) {
    score += 1;
    scoreLabel.textContent = score.toString();
    showFeedbackDialog(true);
  } else {
    showFeedbackDialog(false);
  }

  clearTimeout(nextRoundTimer);
  startFeedbackCountdown();
}

function finishGame() {
  audioPlayer.pause();
  setPlaybackButtonState(false);
  stopVisualizer();

  const incorrectCount = rounds.length - score;

  if (score === rounds.length) {
    resultsEmoji.textContent = '🏆';
  } else if (score >= rounds.length * 0.7) {
    resultsEmoji.textContent = '🎉';
  } else if (score >= rounds.length * 0.4) {
    resultsEmoji.textContent = '🎵';
  } else {
    resultsEmoji.textContent = '💔';
  }

  resultsScore.textContent = `${score} / ${rounds.length}`;
  resultsCorrectCount.textContent = score;
  resultsIncorrectCount.textContent = incorrectCount;

  if (gameStartTime) {
    const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    resultsTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    resultsTime.classList.remove('hidden');
  } else {
    resultsTime.classList.add('hidden');
  }

  if (lastCategory) {
    resultsCategory.textContent = lastCategory.label;
    resultsCategory.classList.remove('hidden');
  } else {
    resultsCategory.classList.add('hidden');
  }

  gameHeader.classList.add('hidden');
  gameContent.classList.add('hidden');
  gameSection.classList.add('hidden');
  resultsSection.classList.remove('hidden');
}

toggleButton.addEventListener('click', togglePlayback);
restartButton.addEventListener('click', restartPreview);
backButton.addEventListener('click', showSelectionScreen);
customCategoryButton.addEventListener('click', handleCustomCategory);
customCategoryInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    handleCustomCategory();
  }
});
nextButton.addEventListener('click', () => {
  clearInterval(feedbackTimer);
  hideFeedbackDialog();
  currentRoundIndex += 1;
  showRound();
});

restartGameButton.addEventListener('click', () => {
  if (lastCategory) {
    startGame(lastCategory);
  } else {
    showSelectionScreen();
  }
});

backToMenuButton.addEventListener('click', () => {
  showSelectionScreen();
});

document.addEventListener('keydown', (event) => {
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
    return;
  }

  if (gameSection.classList.contains('hidden')) {
    return;
  }

  const key = event.key;

  if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) {
    return;
  }

  if (['1', '2', '3', '4'].includes(key)) {
    if (!feedbackDialog.classList.contains('hidden')) {
      return;
    }
    const buttons = Array.from(answerButtons.querySelectorAll('button:not([disabled])'));
    const index = parseInt(key) - 1;
    if (index < buttons.length) {
      buttons[index].click();
    }
    return;
  }

  if (key === ' ') {
    event.preventDefault();
    if (!feedbackDialog.classList.contains('hidden')) {
      return;
    }
    togglePlayback();
    return;
  }

  if (key === 'Enter') {
    if (!feedbackDialog.classList.contains('hidden')) {
      event.preventDefault();
      clearInterval(feedbackTimer);
      hideFeedbackDialog();
      currentRoundIndex += 1;
      showRound();
    }
    return;
  }
});

audioPlayer.addEventListener('play', () => {
  setPlaybackButtonState(true);
  startVisualizer();
});
audioPlayer.addEventListener('pause', () => {
  setPlaybackButtonState(false);
  stopVisualizer();
});
audioPlayer.addEventListener('ended', () => {
  setPlaybackButtonState(false);
  stopVisualizer();
});
setPlaybackButtonState(false);
renderCategories();

const visualizerEl = document.querySelector('#toggleButton .btn-bars');
const BAR_COUNT = 10;
const bars = [];

for (let i = 0; i < BAR_COUNT; i++) {
  const bar = document.createElement('div');
  bar.className = 'bar';
  bar.style.height = '4px';
  visualizerEl.appendChild(bar);
  bars.push(bar);
}

let audioCtx = null;
let analyser = null;
let animFrameId = null;
let dataArray = null;

function initAudioContext() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 64;
  const source = audioCtx.createMediaElementSource(audioPlayer);
  source.connect(analyser);
  analyser.connect(audioCtx.destination);
  dataArray = new Uint8Array(analyser.frequencyBinCount);
}

function startVisualizer() {
  initAudioContext();
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  drawBars();
}

function stopVisualizer() {
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
  bars.forEach((bar) => {
    bar.style.height = '4px';
  });
}

function drawBars() {
  analyser.getByteFrequencyData(dataArray);
  const step = Math.floor(dataArray.length / BAR_COUNT);

  for (let i = 0; i < BAR_COUNT; i++) {
    const value = dataArray[i * step];
    const height = Math.max(4, (value / 255) * 60);
    bars[i].style.height = height + 'px';
  }

  animFrameId = requestAnimationFrame(drawBars);
}

function shuffleArray(values) {
  const copy = [...values];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

(function initFromUrl() {
  const param = new URLSearchParams(window.location.search).get('category');
  if (!param) return;
  const found = categories.find((c) => c.label === param);
  startGame(found || { label: param, term: param });
})();

window.addEventListener('popstate', () => {
  const param = new URLSearchParams(window.location.search).get('category');
  if (!param) {
    showSelectionScreen();
    return;
  }
  const found = categories.find((c) => c.label === param);
  startGame(found || { label: param, term: param });
});
