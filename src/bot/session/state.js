const userStates = new Map();

export function getState(userId) {
  return userStates.get(userId) || null;
}

export function setState(userId, state) {
  userStates.set(userId, state);
}

export function clearState(userId) {
  userStates.delete(userId);
}
