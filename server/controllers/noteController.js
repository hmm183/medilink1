// controllers/noteController.js
const PatientNote = require('../models/patientNoteModel');

/**
 * Helper to determine the requester/patient id.
 * Prefers req.user.id (auth), then req.body.patientId, then req.params.patientId.
 */
function getRequesterId(req) {
  if (req.user && req.user.id) return req.user.id;
  if (req.body && req.body.patientId) return req.body.patientId;
  if (req.params && req.params.patientId) return req.params.patientId;
  return null;
}

// GET /api/v1/notes/patient/:patientId?includeArchived=true|false
exports.getNotesByPatient = async (req, res) => {
  try {
    const patientId = req.params.patientId;
    if (!patientId) {
      return res.status(400).json({ success: false, message: 'patientId is required in URL.' });
    }

    const filter = { patientId };
    if (req.query.includeArchived !== 'true') {
      filter.isArchived = false;
    }

    const notes = await PatientNote.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: notes });
  } catch (error) {
    console.error('getNotesByPatient error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/v1/notes
exports.createNote = async (req, res) => {
  try {
    const { noteText } = req.body;
    const patientId = getRequesterId(req);

    if (!noteText || !noteText.toString().trim()) {
      return res.status(400).json({ success: false, message: 'noteText is required.' });
    }
    if (!patientId) {
      return res.status(401).json({ success: false, message: 'Not authorized (patientId missing).' });
    }

    const note = new PatientNote({
      patientId,
      noteText: noteText.toString().trim(),
      isArchived: false,
      createdAt: new Date(),
    });

    await note.save();
    return res.status(201).json({ success: true, data: note });
  } catch (error) {
    console.error('createNote error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /api/v1/notes/:id
exports.updateNote = async (req, res) => {
  try {
    const { noteText } = req.body;
    if (!noteText || !noteText.toString().trim()) {
      return res.status(400).json({ success: false, message: 'Note text is required.' });
    }

    const note = await PatientNote.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found.' });
    }

    const requesterId = getRequesterId(req);
    if (!requesterId) {
      return res.status(401).json({ success: false, message: 'Not authorized (no user/patientId).' });
    }

    if (note.patientId.toString() !== requesterId) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this note.' });
    }

    note.noteText = noteText.toString().trim();
    await note.save();
    return res.status(200).json({ success: true, data: note });
  } catch (error) {
    console.error('updateNote error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// DELETE (soft) /api/v1/notes/:id
exports.deleteNote = async (req, res) => {
  try {
    const note = await PatientNote.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found.' });
    }

    const requesterId = getRequesterId(req);
    if (!requesterId) {
      return res.status(401).json({ success: false, message: 'Not authorized (no user/patientId).' });
    }

    if (note.patientId.toString() !== requesterId) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this note.' });
    }

    // Soft delete: mark archived
    note.isArchived = true;
    await note.save();
    return res.status(200).json({ success: true, data: note });
  } catch (error) {
    console.error('deleteNote error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /api/v1/notes/:id/restore
exports.restoreNote = async (req, res) => {
  try {
    const note = await PatientNote.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found.' });
    }

    const requesterId = getRequesterId(req);
    if (!requesterId) {
      return res.status(401).json({ success: false, message: 'Not authorized (no user/patientId).' });
    }

    if (note.patientId.toString() !== requesterId) {
      return res.status(403).json({ success: false, message: 'Not authorized to restore this note.' });
    }

    note.isArchived = false;
    await note.save();
    return res.status(200).json({ success: true, data: note });
  } catch (error) {
    console.error('restoreNote error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};
