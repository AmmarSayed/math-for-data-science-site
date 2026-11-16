for (const practice of document.querySelectorAll('[data-practice]')) {
  const feedback = practice.querySelector('[data-feedback-output]');

  practice.addEventListener('submit', (event) => {
    event.preventDefault();
    const choice = practice.querySelector('input[type="radio"]:checked');
    feedback.textContent = choice.dataset.feedback;
    feedback.dataset.result = 'correct' in choice.dataset ? 'correct' : 'retry';
  });
}
