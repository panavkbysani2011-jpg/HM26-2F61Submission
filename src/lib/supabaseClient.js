import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase credentials not found. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env.");
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseKey || 'placeholder-key'
);

export const submitIncident = async (payload) => {
    return await supabase.from('incidents').insert(payload).select().single();
};

export const fetchActiveIncidents = async () => {
    return await supabase.from('incidents').select('*').neq('status', 'RESOLVED').order('created_at', { ascending: false });
};

export const fetchAllIncidents = async () => {
    return await supabase.from('incidents').select('*').order('created_at', { ascending: false });
};

export const uploadEvidence = async (file, fileName) => {
    const { error } = await supabase.storage.from('evidence').upload(`public/${fileName}`, file, {
        cacheControl: '3600',
        upsert: false
    });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('evidence').getPublicUrl(`public/${fileName}`);
    return publicUrl;
};

export const resolveIncident = async (id, imageUrl) => {
    return await supabase.from('incidents').update({ status: 'RESOLVED', after_image_url: imageUrl, resolved_at: new Date().toISOString() }).eq('id', id);
};

export const writeLedger = async (payload) => {
    return await supabase.from('inter_agency_clearing_ledger').insert(payload);
};

export const subscribeToIncidents = (callback) => {
    return supabase
        .channel('realtime:incidents')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, payload => {
            callback(payload);
        })
        .subscribe();
};
