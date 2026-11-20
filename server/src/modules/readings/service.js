import * as repo from './repository.js';
import { AppError } from '../../utils/AppError.js';
import { MAX_READINGS_PER_DAY, SLOT_LABELS } from './slots.js';

const UNIQUE_VIOLATION = '23505';

const maxPerDayError = () => {
  const message = `You can add only ${MAX_READINGS_PER_DAY} readings per day.`;
  return new AppError(409, 'MAX_READINGS_PER_DAY', message, { date: message });
};

const duplicateSlotError = (slot) => {
  const message = `You already have an ${SLOT_LABELS[slot]} reading for this date.`;
  return new AppError(409, 'DUPLICATE_SLOT', message, { slot: message });
};

const notFoundError = () => new AppError(404, 'READING_NOT_FOUND', 'Reading not found.');

/**
 * The unique (user, date, slot) constraint is the real guard against duplicates and
 * against more than 4 readings a day, so it holds even for concurrent requests.
 * The explicit checks below exist to return clear messages in the normal case.
 */
async function withConflictMapping(slot, fn) {
  try {
    return await fn();
  } catch (err) {
    if (err.code === UNIQUE_VIOLATION && err.constraint === 'readings_user_date_slot_uniq') {
      throw duplicateSlotError(slot);
    }
    throw err;
  }
}

export async function createReading(userId, input) {
  if ((await repo.countForDate(userId, input.date)) >= MAX_READINGS_PER_DAY) throw maxPerDayError();
  return withConflictMapping(input.slot, () => repo.insert(userId, input));
}

export async function listReadings(userId, range) {
  return repo.list(userId, range);
}

export async function getReading(userId, id) {
  const reading = await repo.findById(userId, id);
  if (!reading) throw notFoundError();
  return reading;
}

export async function updateReading(userId, id, input) {
  const existing = await repo.findById(userId, id);
  if (!existing) throw notFoundError();

  // Moving a reading to another day must respect that day's limit.
  if (input.date !== existing.date && (await repo.countForDate(userId, input.date, id)) >= MAX_READINGS_PER_DAY) {
    throw maxPerDayError();
  }
  const updated = await withConflictMapping(input.slot, () => repo.update(userId, id, input));
  if (!updated) throw notFoundError();
  return updated;
}

export async function deleteReading(userId, id) {
  if (!(await repo.remove(userId, id))) throw notFoundError();
}
