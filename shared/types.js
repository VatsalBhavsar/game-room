/**
 * @typedef {"fastest-correct" | "fastest-submit" | "host-picks"} ScoringMode
 *
 * @typedef {Object} RoomSettings
 * @property {number} rounds
 * @property {number} questionsPerRound
 * @property {ScoringMode} scoringMode
 * @property {number[]} scoringPositions
 * @property {boolean} lockAfterSubmit
 *
 * @typedef {Object} Player
 * @property {string} id
 * @property {string} name
 * @property {boolean} isHost
 * @property {boolean} isReady
 * @property {number} joinedAt
 * @property {boolean} connected
 *
 * @typedef {Object} Submission
 * @property {string} submissionId
 * @property {string} playerId
 * @property {string} name
 * @property {string} answer
 * @property {boolean} isCorrect
 * @property {number} submittedAt
 * @property {number} order
 *
 * @typedef {Object} QuestionResult
 * @property {string[]} correctSubmissionIds
 * @property {string[]} winnerSubmissionIds
 *
 * @typedef {Object} QuestionState
 * @property {number} roundIndex
 * @property {number} questionIndex
 * @property {string} prompt
 * @property {string} imageUrl
 * @property {string} correctAnswer
 * @property {boolean} locked
 * @property {Submission[]} submissions
 * @property {QuestionResult} result
 * @property {boolean} confirmed
 *
 * @typedef {Object} RoomState
 * @property {string} roomId
 * @property {string} roomName
 * @property {string} hostId
 * @property {RoomSettings} settings
 * @property {"lobby" | "in_progress" | "finished"} status
 * @property {number} currentRoundIndex
 * @property {number} currentQuestionIndex
 * @property {Player[]} players
 * @property {QuestionState[]} questions
 * @property {Object.<string, number>} scores
 * @property {number} createdAt
 * @property {number} updatedAt
 */
export {};
