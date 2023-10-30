const calcLeetCodeScore = (score) => {
  let leetCodeScore = 0;
  leetCodeScore += Number(score.easy_questions_solved) * 5;
  leetCodeScore += Number(score.medium_questions_solved) * 10;
  leetCodeScore += Number(score.hard_questions_solved) * 15;
  leetCodeScore = Math.round(leetCodeScore);
  return leetCodeScore;
};

const calcCodeChefScore = (score) => {
  let codeChefScore = 0;
  codeChefScore += Number(score.fully_solved) * 10;
  codeChefScore += (Number(score.rating) - 1300) ** 2 / 30;
  codeChefScore = Math.round(codeChefScore);
  return codeChefScore;
};

const calcCodeForcesScore = (score) => {
  let codeForcesScore = 0;
  codeForcesScore += Number(score.problem_count) * 10;
  codeForcesScore += (Number(score.rating) - 1200) ** 2 / 30;
  codeForcesScore = Math.round(codeForcesScore);
  return codeForcesScore;
};

const calcGeeksForGeeksScore = (score) => {
  let geeksForGeeksScore = 0;
  geeksForGeeksScore += Number(score.solved) * 10;
  geeksForGeeksScore += Number(score.score);
  geeksForGeeksScore = Math.round(geeksForGeeksScore);
  return geeksForGeeksScore;
};

const calcSpojScore = (score) => {
  let spojScore = 0;
  spojScore += Number(score.points) * 500;
  spojScore += Number(score.solved) * 20;
  spojScore = Math.round(spojScore);
  return spojScore;
};

const calcInterviewBitScore = (score) => {
  let interviewBitScore = 0;
  interviewBitScore += Number(score.score) / 3;
  interviewBitScore = Math.round(interviewBitScore);
  return interviewBitScore;
};

const calcKLHCodeScore = (participation, flag = false) => {
  let klhCodeScore = 0;
  if (participation) {
    var total = [];
    for (var i = 0; i < participation.length; i++) {
      for (var j = 0; j < participation[i]["submissionResults"].length; j++) {
        if (participation[i]["submissionResults"][j].score == 100) {
          total = total.concat(
            participation[i]["submissionResults"][j].questionId
          );
        }
      }
    }
    var totalSet = new Set(total);
    if (flag) {
      klhCodeScore += Number(totalSet.size) * 100;
    } else {
      klhCodeScore += Number(totalSet.size) * 10;
    }
  }
  return klhCodeScore;
};

module.exports = {
  calcLeetCodeScore,
  calcCodeChefScore,
  calcCodeForcesScore,
  calcGeeksForGeeksScore,
  calcSpojScore,
  calcInterviewBitScore,
  calcKLHCodeScore,
};
