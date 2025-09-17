import { createClient } from '@/lib/supabase/server'
import React from 'react'

const Home = async () =>  {
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