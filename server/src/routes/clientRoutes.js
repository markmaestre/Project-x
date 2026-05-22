import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { supabase } from "../config/supabase.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// REGISTER
router.post("/register", async (req, res) => {
  const { first_name, last_name, work_email, password, country, image_url } = req.body;

  try {
    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from("clients")
      .select("work_email")
      .eq("work_email", work_email)
      .single();

    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("clients")
      .insert([
        {
          first_name,
          last_name,
          work_email,
          password: hashedPassword,
          country,
          image_url: image_url || null,
        },
      ])
      .select();

    if (error) return res.status(400).json(error);

    res.json({
      message: "User registered successfully",
      user: data[0],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  const { work_email, password } = req.body;

  try {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("work_email", work_email)
      .single();

    if (error || !data) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, data.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: data.id,
        email: data.work_email,
        first_name: data.first_name,
        last_name: data.last_name,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: data.id,
        first_name: data.first_name,
        last_name: data.last_name,
        work_email: data.work_email,
        country: data.country,
        image_url: data.image_url,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET USER PROFILE (Protected Route Example)
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("clients")
      .select("id, first_name, last_name, work_email, country, image_url, created_at")
      .eq("id", req.user.id)
      .single();

    if (error) {
      return res.status(400).json({ message: "User not found" });
    }

    res.json({ user: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE USER PROFILE (Protected Route Example)
router.put("/profile", authMiddleware, async (req, res) => {
  const { first_name, last_name, country, image_url } = req.body;

  try {
    const { data, error } = await supabase
      .from("clients")
      .update({
        first_name,
        last_name,
        country,
        image_url,
        updated_at: new Date(),
      })
      .eq("id", req.user.id)
      .select();

    if (error) {
      return res.status(400).json({ message: "Update failed" });
    }

    res.json({
      message: "Profile updated successfully",
      user: data[0],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;