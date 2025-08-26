'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function logout() {
  const supabase = createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function updateProjectStatusToCompleted(projectId: string | number) {
  const supabase = createClient()
  
  console.log("Server action: Updating project status to completed for project ID:", projectId, "Type:", typeof projectId);
  
  // First, let's check if we can read the current project
  const { data: currentProject, error: readError } = await supabase
    .from("proyectos")
    .select("id, name, status")
    .eq("id", projectId)
    .maybeSingle();
  
  if (readError) {
    console.error("Server action: Failed to read project:", readError);
    throw new Error(`Failed to read project: ${readError.message}`);
  }
  
  console.log("Server action: Current project data:", currentProject);
  
  // Now try to update the status
  const { data, error } = await supabase
    .from("proyectos")
    .update({ status: "completed" })
    .eq("id", projectId)
    .select("id, status");
  
  if (error) {
    console.error("Server action: Failed to update project status:", error);
    console.error("Server action: Error details:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    throw new Error(`Failed to update project status: ${error.message}`);
  }
  
  console.log("Server action: Project status updated successfully:", data);
  
  // Revalidate the project page
  revalidatePath(`/projects/${projectId}`)
  
  return data;
}