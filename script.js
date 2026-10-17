const scoreElements = document.querySelectorAll(".score-value strong");
const averageElement = document.querySelector("#average-score");
const descriptionElement = document.querySelector("#result-description");

const scores = Array.from(scoreElements, (element) => Number(element.textContent));
const average = Math.round(scores.reduce((total, score) => total + score, 0) / scores.length);

averageElement.textContent = average;
averageElement.parentElement.setAttribute("aria-label", `Score: ${average} out of 100`);

if (average >= 90) {
  descriptionElement.textContent =
    "You scored higher than 90% of the people who have taken these tests";
} else if (average >= 75) {
  descriptionElement.textContent =
    "You scored higher than 65% of the people who have taken these tests";
} else {
  descriptionElement.textContent = "You scored lower than most people who have taken these tests";
}
