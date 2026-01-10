// pages/api/projects.js
import { supabase } from "@/lib/supabaseClient";

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    // GET: Fetch all projects
    case "GET":
      try {
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        res.status(200).json(data);
      } catch (error) {
        console.error("GET Projects Error:", error.message);
        res.status(500).json({ error: "Failed to fetch projects" });
      }
      break;

    // POST: Create a new project
    case "POST":
      const { title, description, price, thumbnail, duration, technique, link } = req.body;
      try {
        const { data, error } = await supabase
          .from("projects")
          .insert([
            { 
              title, 
              description, 
              price, 
              thumbnail, 
              duration, 
              technique, 
              link: link || '#' // Default to # if empty
            }
          ])
          .select(); // IMPORTANT: Returns the inserted object

        if (error) throw error;
        
        // Supabase returns an array, we want the single object
        res.status(201).json(data[0]);
      } catch (error) {
        console.error("POST Projects Error:", error.message);
        res.status(500).json({ error: "Failed to create project" });
      }
      break;

    // PUT: Update an existing project
    case "PUT":
      const { id, updatedData } = req.body;
      try {
        const { data, error } = await supabase
          .from("projects")
          .update({ 
            ...updatedData, 
            updated_at: new Date().toISOString() // Keep timestamp fresh
          })
          .eq("id", id)
          .select(); // IMPORTANT: Returns the updated object

        if (error) throw error;
        res.status(200).json(data[0]);
      } catch (error) {
        console.error("PUT Projects Error:", error.message);
        res.status(500).json({ error: "Failed to update project" });
      }
      break;

    // DELETE: Delete a project
    case "DELETE":
      const { projectId } = req.body;
      try {
        const { error } = await supabase
          .from("projects")
          .delete()
          .eq("id", projectId);

        if (error) throw error;
        res.status(200).json({ message: "Project deleted successfully" });
      } catch (error) {
        console.error("DELETE Projects Error:", error.message);
        res.status(500).json({ error: "Failed to delete project" });
      }
      break;

    default:
      res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
      res.status(405).json({ error: `Method ${method} Not Allowed` });
      break;
  }
}