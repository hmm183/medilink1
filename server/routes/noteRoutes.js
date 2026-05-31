const express = require('express');
const router = express.Router();
const { getNotesByPatient, createNote, updateNote,deleteNote,restoreNote} = require('../controllers/noteController');

// The router.use(protect) line is removed as requested.

// MODIFIED: This route now accepts a patientId
router.route('/patient/:patientId').get(getNotesByPatient);

router.route('/').post(createNote);
router.route('/:id').put(updateNote).delete(deleteNote);
router.route('/:id/restore').put(restoreNote);

module.exports = router;