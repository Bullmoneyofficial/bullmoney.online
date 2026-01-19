import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET: Fetch all projects
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET Projects Error:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

// POST: Create a new project
export async function POST(request: Request) {
  try {
    const { title, description, price, thumbnail, duration, technique, link } = await request.json();
    
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
          link: link || '#'
        }
      ])
      .select();

    if (error) throw error;
    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error("POST Projects Error:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}

// PUT: Update an existing project
export async function PUT(request: Request) {
  try {
    const { id, updatedData } = await request.json();
    
    const { data, error } = await supabase
      .from("projects")
      .update({ 
        ...updatedData, 
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select();

    if (error) throw error;
    return NextResponse.json(data[0]);
  } catch (error) {
    console.error("PUT Projects Error:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

// DELETE: Delete a project
export async function DELETE(request: Request) {
  try {
    const { projectId } = await request.json();
    
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (error) throw error;
    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("DELETE Projects Error:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
