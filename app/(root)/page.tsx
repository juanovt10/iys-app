import { createClient } from '@/lib/supabase/server'
import { getSessionAndRole } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import React from 'react'

const Home = async () =>  {
  const { role } = await getSessionAndRole()
  if (role === 'site_manager') {
    redirect('/projects')
  }
  const supabase = createClient()
  const { data: sessionData, error: sErr } = await supabase.auth.getSession();
  console.log('session', sessionData, sErr);

  const { data, error } = await supabase.rpc('debug_whoami');
  console.log('client whoami data', data, 'error', error);
  return (
    <div>
      Aca va ir un dashboard 
    </div>
  )
}

export default Home