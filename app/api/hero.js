// pages/api/hero.js
import { supabase } from "@/lib/supabaseClient";

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    // GET: Fetch hero content
    case "GET":
      try {
        // CHANGED: Table 'alexa_hero', ID is boolean 'true'
        const { data, error } = await supabase
          .from("alexa_hero")
          .select("*")
          .eq("id", true)
          .single();

        if (error) throw error;
        res.status(200).json(data);
      } catch (error) {
        console.error("GET Error:", error.message);
        res.status(500).json({ error: "Failed to fetch hero content" });
      }
      break;

    // PUT: Update hero content
    case "PUT":
      const { headline, subheadline, button_text, beam_text_1, beam_text_2, beam_text_3 } = req.body;
      
      try {
        // CHANGED: Upsert to 'alexa_hero' with ID 'true'
        const { error } = await supabase
          .from("alexa_hero")
          .upsert([
            {
              id: true, // Singleton ID
              headline,
              subheadline,
              button_text,
              beam_text_1,
              beam_text_2,
              beam_text_3,
              updated_at: new Date().toISOString(),
            },
          ]);

        if (error) throw error;
        res.status(200).json({ message: "Hero content updated successfully" });
      } catch (error) {
        console.error("PUT Error:", error.message);
        res.status(500).json({ error: "Failed to update hero content" });
      }
      break;

    default:
      res.setHeader("Allow", ["GET", "PUT"]);
      res.status(405).json({ error: `Method ${method} Not Allowed` });
      break;
  }
}