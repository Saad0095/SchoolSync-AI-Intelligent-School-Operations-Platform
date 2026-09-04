import Subject from "../models/Subject.js";

export const createSubject = async (req, res) => {
  try {
    const { name, code, description } = req.body;
    const subject = await Subject.create({
      name,
      code,
      description,
      createdBy: req.user._id,
    });
    res.status(201).json({
      message: "Subject created sucessfully!",
      subject: { id: subject._id, name: subject.name, code: subject.code },
    });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Error creating subject", error: err.message });
  }
};

export const getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ isActive: true });
    res.json(subjects);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching subjects", error: err.message });
  }
};

export const getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ message: "Subject not found" });
    res.json(subject);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching subjects", error: err.message });
  }
};

export const updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!subject) return res.status(404).json({ message: "Subject not found" });
    res.json({
      message: "Subject updated successfully!",
      subject: { id: subject._id, name: subject.name, code: subject.code, description: subject.description },
    });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Error updating subject", error: err.message });
  }
};

export const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ message: "Subject not found" });
    await Subject.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    res.json({ message: "Subject soft deleted successfully!" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting subject", error: err.message });
  }
};
