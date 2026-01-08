// src/handlers/downline.handler.js
import {
  getAllDownlines,
  createDownline,
  getDownlineById,
  updateDownline,
  deleteDownline,
  masterDownlines,
} from "../service/downlineService.js";

export const getAllDownlinesHandler = async (req, res) => {
  try {
    const result = await getAllDownlines(req.query);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const createDownlineHandler = async (req, res) => {
  try {
    const downline = await createDownline(req.body);
    res.status(201).json(downline);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getDownlineHandler = async (req, res) => {
  try {
    const downline = await getDownlineById(req.params.id);
    res.json(downline);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

export const updateDownlineHandler = async (req, res) => {
  try {
    const downline = await updateDownline(req.params.id, req.body);
    res.json(downline);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteDownlineHandler = async (req, res) => {
  try {
    await deleteDownline(req.params.id);
    res.status(204).end();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getDownlineMaster = async (req, res) => {
  try {
    const data = await masterDownlines();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
