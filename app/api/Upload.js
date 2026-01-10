// pages/api/upload.js
import { supabase } from "@/lib/supabaseClient";  // Assuming you have a supabase client file

export default async function handler(req, res) {
  if (req.method === "POST") {
    const file = req.body.file;  // You will need to handle the file upload here properly

    try {
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(file.name, file);

      if (uploadError) throw uploadError;

      const { publicURL, error: urlError } = supabase.storage.from('images').getPublicUrl(file.name);

      if (urlError) throw urlError;

      res.status(200).json({ url: publicURL });
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to upload image" });
    }
  } else {
    res.status(405).json({ error: "Method Not Allowed" });
  }
}
