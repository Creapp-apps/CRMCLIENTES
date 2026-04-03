import { supabase } from '../lib/supabaseClient';

// ==================== PROJECTS ====================

export async function fetchProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createProject({ name, code, pricing_type, base_price }) {
  const { data, error } = await supabase
    .from('projects')
    .insert({ name, code, pricing_type, base_price })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProject(projectId, updates) {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProject(projectId) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);
  if (error) throw error;
  return true;
}

// ==================== PROJECT PLANS ====================

export async function createProjectPlan({ project_id, name, price, billing_cycle }) {
  const { data, error } = await supabase
    .from('project_plans')
    .insert({ project_id, name, price, billing_cycle })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchProjectPlans(projectId) {
  const { data, error } = await supabase
    .from('project_plans')
    .select('*')
    .eq('project_id', projectId)
    .eq('is_active', true)
    .order('price', { ascending: true });
  if (error) throw error;
  return data;
}

// ==================== LEADS ====================

export async function fetchLeads(projectId = null) {
  let allData = [];
  let from = 0;
  const step = 1000;

  while (true) {
    let query = supabase
      .from('leads')
      .select('*, projects(name, code)')
      .order('next_contact_date', { ascending: true, nullsFirst: false })
      .order('id', { ascending: true })
      .range(from, from + step - 1);

    if (projectId) query = query.eq('project_id', projectId);
    
    const { data, error } = await query;
    if (error) throw error;
    
    if (data && data.length > 0) {
      allData = allData.concat(data);
      if (data.length < step) break;
      from += step;
    } else {
      break;
    }
  }
  return allData;
}

export async function fetchUrgentLeads() {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  let allData = [];
  let from = 0;
  const step = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('leads')
      .select('*, projects(name, code)')
      .lte('next_contact_date', today.toISOString())
      .neq('status', 'won')
      .neq('status', 'lost')
      .order('next_contact_date', { ascending: true, nullsFirst: false })
      .order('id', { ascending: true })
      .range(from, from + step - 1);

    if (error) throw error;

    if (data && data.length > 0) {
      allData = allData.concat(data);
      if (data.length < step) break;
      from += step;
    } else {
      break;
    }
  }

  return allData;
}

export async function createLead({ project_id, name, company, source, channel }) {
  const { data, error } = await supabase
    .from('leads')
    .insert({ project_id, name, company, source, channel, status: 'uncontacted' })
    .select('*, projects(name, code)')
    .single();
  if (error) throw error;
  return data;
}

export async function bulkCreateLeads(leadsArray) {
  // leadsArray must have the right shape: {project_id, name, company, source, channel, status}
  const { data, error } = await supabase
    .from('leads')
    .insert(leadsArray)
    .select();
  if (error) throw error;
  return data;
}

export async function updateLeadStatus(leadId, status, nextContactDate = null, { dealPlanId = null, promoCode = null } = {}) {
  const updates = { status };
  if (nextContactDate !== undefined && nextContactDate !== null) updates.next_contact_date = nextContactDate;
  if (dealPlanId) updates.deal_plan_id = dealPlanId;
  if (promoCode !== null && promoCode !== undefined) updates.promo_code = promoCode;

  const { data, error } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', leadId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteLead(leadId) {
  const { error, count } = await supabase
    .from('leads')
    .delete({ count: 'exact' })
    .eq('id', leadId);
  if (error) throw error;
  if (count === 0) throw new Error("Acceso RLS denegado: El lead no se eliminó porque te faltan permisos en Supabase (Asegurate de haber corrido el SQL).");
  return true;
}

// ==================== INTERACTIONS ====================

export async function createInteraction({ lead_id, sdr_id, action_type, outcome, notes }) {
  const { data, error } = await supabase
    .from('interactions')
    .insert({ lead_id, sdr_id, action_type, outcome, notes })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchInteractionsForLead(leadId) {
  const { data, error } = await supabase
    .from('interactions')
    .select('*, profiles(full_name)')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// ==================== TEAM & COMMISSIONS (Admin) ====================

export async function fetchTeam() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, sdr_project_commissions(*, projects(name, code))')
    .order('full_name');
  if (error) throw error;
  return data;
}

export async function fetchCommissionsForSdr(sdrId) {
  const { data, error } = await supabase
    .from('sdr_project_commissions')
    .select('*, projects(name, code)')
    .eq('sdr_id', sdrId);
  if (error) throw error;
  return data;
}

export async function assignSdrToProject(sdrId, projectId, commissionType, commissionValue) {
  const { data, error } = await supabase
    .from('sdr_project_commissions')
    .insert({
      sdr_id: sdrId,
      project_id: projectId,
      commission_type: commissionType,
      commission_value: commissionValue
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ==================== STATS (Admin Dashboard) ====================

export async function fetchGlobalStats() {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { count: totalLeadsMonth } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', firstOfMonth);

  const { count: totalWon } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'won');

  const { count: totalLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true });

  const conversionRate = totalLeads > 0 ? ((totalWon / totalLeads) * 100).toFixed(1) : '0';

  return {
    totalLeadsMonth: totalLeadsMonth || 0,
    totalWon: totalWon || 0,
    conversionRate
  };
}
