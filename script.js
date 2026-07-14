const categories = [
  { label: 'Movies', term: 'movie' },
  { label: 'Games', term: 'game' },
  { label: 'Anime', term: 'anime' },
  { label: 'Rock', term: 'rock' },
  { label: 'Jazz', term: 'jazz' },
  { label: 'Classical', term: 'classical' },
  { label: 'Hip Hop', term: 'hip hop' },
  { label: 'Pop', term: 'pop' },
  { label: 'Disco', term: 'disco' },
  { label: 'Lo-fi', term: 'lofi' },
  { label: 'Country', term: 'country' },
  { label: 'Nina Chuba', term: 'nina chuba' },
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
const feedbackMessage = document.getElementById('feedbackMessage');
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

let songs = [];
let rounds = [];
let currentRoundIndex = 0;
let score = 0;
let currentQuestion = null;
let nextRoundTimer = null;
let feedbackTimer = null;
let feedbackCountdownValue = 3;
let isAudioPlaying = false;

function renderCategories() {
  categoryButtons.innerHTML = '';

  categories.forEach((category) => {
    const button = document.createElement('button');
    button.textContent = category.label;
    button.addEventListener('click', () => startGame(category));
    categoryButtons.appendChild(button);
  });
}

function setStatus(text) {
  statusMessage.textContent = text;
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
  feedbackMessage.textContent = '';
  hideFeedbackDialog();
  answerButtons.innerHTML = '';
  gameHeader.classList.add('hidden');
  gameContent.classList.add('hidden');
  gameStatusMessage.classList.add('hidden');
  gameStatusMessage.textContent = '';
  gameSection.classList.add('hidden');
  selectionSection.classList.remove('hidden');
  audioPlayer.pause();
  audioPlayer.src = '';
  audioPlayer.load();
  setPlaybackButtonState(false);
}

function showSelectionScreen() {
  selectionSection.classList.remove('hidden');
  gameSection.classList.add('hidden');
  resetGameState();
  setStatus('');
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
  gameHeader.classList.add('hidden');
  gameContent.classList.add('hidden');
  gameStatusMessage.classList.add('hidden');
}

function hideLoading() {
  loadingOverlay.classList.add('hidden');
}

function setPlaybackButtonState(isPlaying) {
  isAudioPlaying = isPlaying;
  toggleButton.textContent = isPlaying ? '⏸' : '▶';
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
  selectionSection.classList.remove('hidden');
  gameSection.classList.add('hidden');
  showLoading();
  setStatus(`Loading ${category.label} songs...`);

  try {
    songs = await fetchSongs(category.term);
    hideLoading();

    if (songs.length < 3) {
      setStatus('Songs not found.');
      return;
    }

    clearGameError();
    rounds = buildRounds(songs, 10);
    selectionSection.classList.add('hidden');
    gameSection.classList.remove('hidden');
    showRound();
  } catch (error) {
    hideLoading();
    console.error(error);
    setStatus('Songs not found.');
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

  return correctSongs.map((correctSong) => {
    const wrongChoices = shuffleArray(
      allSongs.filter((song) => song.trackId !== correctSong.trackId)
    ).slice(0, 2);

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
  feedbackMessage.textContent = '';
  answerButtons.innerHTML = '';
  gameHeader.classList.remove('hidden');
  gameContent.classList.remove('hidden');
  clearGameError();

  currentQuestion.options.forEach((option) => {
    const button = document.createElement('button');
    button.innerHTML = `
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
    feedbackMessage.textContent = 'Correct!';
    showFeedbackDialog(true);
  } else {
    feedbackMessage.textContent = 'Not quite.';
    showFeedbackDialog(false);
  }

  clearTimeout(nextRoundTimer);
  startFeedbackCountdown();
}

function finishGame() {
  feedbackMessage.textContent = `Final score: ${score} / ${rounds.length}`;
  answerButtons.innerHTML = '';
  toggleButton.disabled = true;
  restartButton.disabled = true;
  setStatus('Choose another category to play again.');
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

audioPlayer.addEventListener('play', () => setPlaybackButtonState(true));
audioPlayer.addEventListener('pause', () => setPlaybackButtonState(false));
audioPlayer.addEventListener('ended', () => setPlaybackButtonState(false));
setPlaybackButtonState(false);
renderCategories();

function shuffleArray(values) {
  const copy = [...values];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}
