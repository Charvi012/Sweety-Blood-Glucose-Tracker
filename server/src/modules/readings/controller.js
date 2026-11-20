import * as service from './service.js';

export async function create(req, res) {
  const reading = await service.createReading(req.user.id, req.validated.body);
  res.status(201).json({ reading });
}

export async function list(req, res) {
  const readings = await service.listReadings(req.user.id, req.validated.query);
  res.json({ readings });
}

export async function getOne(req, res) {
  const reading = await service.getReading(req.user.id, req.validated.params.id);
  res.json({ reading });
}

export async function update(req, res) {
  const reading = await service.updateReading(req.user.id, req.validated.params.id, req.validated.body);
  res.json({ reading });
}

export async function remove(req, res) {
  await service.deleteReading(req.user.id, req.validated.params.id);
  res.status(204).end();
}
