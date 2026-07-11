import { createClient } from '@supabase/supabase-js';

// ─── Supabase Client ──────────────────────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://your-project-ref.supabase.co');

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');

/** Helper function to get current logged in user's ID */
export async function getCurrentUserId(): Promise<string | null> {
  if (!isSupabaseConfigured) return 'local-admin';
  const { data: sessionData } = await supabase.auth.getSession();
  return sessionData.session?.user?.id || null;
}

// ─── Types (matching the exact SQL schema) ────────────────────────────────────
export interface Admin {
  id: string;
  username: string;
  email: string;
  created_at: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  address: string;
  created_at: string;
  created_by?: string;
}

export interface Visit {
  id: string;
  patient_id: string;
  date: string;
  complaint: string;
  diagnosis: string;
  treatment: string;
  prescription: string;
  notes: string;
  created_at: string;
  created_by?: string;
}

// Status values match the CHECK constraint: 'Paid' | 'Pending' | 'Partial'
export interface Finance {
  id: string;
  visit_id: string;
  consult_fee: number;
  med_cost: number;
  total: number;
  paid: number;
  remaining: number;
  status: 'Paid' | 'Pending' | 'Partial';
  created_at: string;
  patient_name?: string; // hydrated from join
  visit_date?: string;   // hydrated from join
  created_by?: string;
}

export interface Settings {
  id?: number;
  clinic_name: string;
  logo_url: string;
  currency: string;
  default_consult_fee: number;
  created_by?: string;
}

// ─── LocalStorage Fallback (for when Supabase is not configured) ──────────────
const DEFAULT_SETTINGS: Settings = {
  id: 1,
  clinic_name: 'Apex Care Clinic',
  logo_url: '',
  currency: '$',
  default_consult_fee: 50.00,
};

const DEFAULT_PATIENTS: Patient[] = [
  {
    id: 'patient-uuid-1',
    name: 'John Doe',
    age: 34,
    gender: 'Male',
    phone: '+1 (555) 019-2834',
    address: '123 Pine St, Seattle, WA',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'patient-uuid-2',
    name: 'Jane Smith',
    age: 28,
    gender: 'Female',
    phone: '+1 (555) 019-9922',
    address: '456 Oak Ave, Boston, MA',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const DEFAULT_VISITS: Visit[] = [
  {
    id: 'visit-uuid-1',
    patient_id: 'patient-uuid-1',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    complaint: 'Persistent cough and fever for 3 days',
    diagnosis: 'Acute Bronchitis',
    treatment: 'Prescribed antibiotics and cough syrup. Advised rest.',
    prescription: 'Amoxicillin 500mg (3x daily)',
    notes: 'Follow up in a week if symptoms persist.',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'visit-uuid-2',
    patient_id: 'patient-uuid-2',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    complaint: 'Severe migraine and nausea',
    diagnosis: 'Tension Headache',
    treatment: 'Administered IV hydration and pain relief.',
    prescription: 'Sumatriptan 50mg as needed',
    notes: 'Advised lifestyle changes.',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const DEFAULT_FINANCES: Finance[] = [
  {
    id: 'finance-uuid-1',
    visit_id: 'visit-uuid-1',
    consult_fee: 50.00,
    med_cost: 25.00,
    total: 75.00,
    paid: 75.00,
    remaining: 0.00,
    status: 'Paid',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'finance-uuid-2',
    visit_id: 'visit-uuid-2',
    consult_fee: 50.00,
    med_cost: 15.00,
    total: 65.00,
    paid: 30.00,
    remaining: 35.00,
    status: 'Partial',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const initializeLocalStorage = () => {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem('cms_settings')) localStorage.setItem('cms_settings', JSON.stringify(DEFAULT_SETTINGS));
  if (!localStorage.getItem('cms_patients')) localStorage.setItem('cms_patients', JSON.stringify(DEFAULT_PATIENTS));
  if (!localStorage.getItem('cms_visits')) localStorage.setItem('cms_visits', JSON.stringify(DEFAULT_VISITS));
  if (!localStorage.getItem('cms_finances')) localStorage.setItem('cms_finances', JSON.stringify(DEFAULT_FINANCES));
};

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export const auth = {
  /** Sign up a new admin with username, real email, and password. */
  async signUp(username: string, email: string, password: string): Promise<{ error: string | null }> {
    if (!isSupabaseConfigured) return { error: 'Supabase is not configured. Please add your credentials to .env.local' };

    // 1. Create auth user with the real email
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) return { error: signUpError.message };
    if (!data.user) return { error: 'Signup failed: no user returned.' };

    // 2. Insert admin profile
    const { error: insertError } = await supabase
      .from('admins')
      .insert([{ id: data.user.id, username, email }]);

    if (insertError) {
      // Clean up: delete auth user if profile insert fails (best-effort)
      await supabase.auth.admin?.deleteUser?.(data.user.id).catch(() => {});
      return { error: insertError.message };
    }

    return { error: null };
  },

  /** Sign in an existing admin by email + password. */
  async signIn(email: string, password: string): Promise<{ error: string | null }> {
    if (!isSupabaseConfigured) {
      // LocalStorage fallback login
      if (typeof window === 'undefined') return { error: 'Not available on server.' };
      const stored = localStorage.getItem('cms_local_admin');
      if (stored) {
        const admin = JSON.parse(stored);
        if (admin.email === email && admin.password === password) {
          localStorage.setItem('cms_logged_in', 'true');
          localStorage.setItem('cms_admin_user', admin.username);
          return { error: null };
        }
      } else if (email === 'admin@clinic.com' && password === 'adminpassword') {
        // Default demo credentials
        localStorage.setItem('cms_logged_in', 'true');
        localStorage.setItem('cms_admin_user', 'admin');
        return { error: null };
      }
      return { error: 'Invalid email or password.' };
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) return { error: 'Invalid email or password.' };

    return { error: null };
  },

  /** Sign out */
  async signOut(): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cms_logged_in');
      localStorage.removeItem('cms_admin_user');
    }
  },

  /** Check if user is currently authenticated */
  async getSession(): Promise<boolean> {
    if (isSupabaseConfigured) {
      const { data } = await supabase.auth.getSession();
      return !!data.session;
    }
    return typeof window !== 'undefined' && localStorage.getItem('cms_logged_in') === 'true';
  },

  /** Get current admin profile */
  async getAdminProfile(): Promise<Admin | null> {
    if (isSupabaseConfigured) {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return null;
      const { data } = await supabase
        .from('admins')
        .select('*')
        .eq('id', sessionData.session.user.id)
        .maybeSingle();
      return data || null;
    }
    const user = typeof window !== 'undefined' ? localStorage.getItem('cms_admin_user') : null;
    return user ? { id: 'local-admin', username: user, email: 'admin@clinic.com', created_at: new Date().toISOString() } : null;
  },

  /** Update admin credentials (username + email). Also updates the Supabase Auth email. */
  async updateAdmin(adminId: string, newUsername: string, newEmail: string, newPassword?: string): Promise<{ error: string | null }> {
    if (isSupabaseConfigured) {
      // Update admin profile table
      const { error: updateError } = await supabase
        .from('admins')
        .update({ username: newUsername, email: newEmail })
        .eq('id', adminId);

      if (updateError) return { error: updateError.message };

      // Update auth email
      const updatePayload: { email: string; password?: string } = { email: newEmail };
      if (newPassword) updatePayload.password = newPassword;

      const { error: authUpdateError } = await supabase.auth.updateUser(updatePayload);
      if (authUpdateError) return { error: authUpdateError.message };

      return { error: null };
    }

    // LocalStorage fallback
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cms_local_admin');
      const admin = stored ? JSON.parse(stored) : { username: 'admin', email: 'admin@clinic.com', password: 'adminpassword' };
      admin.username = newUsername;
      admin.email = newEmail;
      if (newPassword) admin.password = newPassword;
      localStorage.setItem('cms_local_admin', JSON.stringify(admin));
      localStorage.setItem('cms_admin_user', newUsername);
    }
    return { error: null };
  },
};

// ─── Database CRUD ────────────────────────────────────────────────────────────
export const db = {

  // ── SETTINGS ──────────────────────────────────────────────────────────────
  async getSettings(): Promise<Settings> {
    if (isSupabaseConfigured) {
      const userId = await getCurrentUserId();
      let req = supabase.from('settings').select('*').eq('id', 1);
      if (userId) {
        req = req.eq('created_by', userId);
      }
      const { data, error } = await req.maybeSingle();
      if (!error && data) return data as Settings;
      if (error) console.warn('Supabase getSettings error, using defaults:', error);
    }
    initializeLocalStorage();
    const s = typeof window !== 'undefined' ? localStorage.getItem('cms_settings') : null;
    return s ? JSON.parse(s) : DEFAULT_SETTINGS;
  },

  async updateSettings(updated: Partial<Settings>): Promise<Settings> {
    if (isSupabaseConfigured) {
      const userId = await getCurrentUserId();
      let req = supabase.from('settings').update(updated).eq('id', 1);
      if (userId) {
        req = req.eq('created_by', userId);
      }
      const { data, error } = await req.select().single();
      if (!error && data) return data as Settings;
      console.warn('Supabase updateSettings error:', error);
    }
    initializeLocalStorage();
    const current = await this.getSettings();
    const next = { ...current, ...updated };
    if (typeof window !== 'undefined') localStorage.setItem('cms_settings', JSON.stringify(next));
    return next;
  },

  // ── PATIENTS ──────────────────────────────────────────────────────────────
  async getPatients(query = ''): Promise<Patient[]> {
    if (isSupabaseConfigured) {
      const userId = await getCurrentUserId();
      let req = supabase.from('patients').select('*');
      if (userId) {
        req = req.eq('created_by', userId);
      }
      if (query) req = req.or(`name.ilike.%${query}%,phone.ilike.%${query}%`);
      const { data, error } = await req.order('created_at', { ascending: false });
      if (!error && data) return data as Patient[];
      console.warn('Supabase getPatients error:', error);
    }
    initializeLocalStorage();
    const raw = typeof window !== 'undefined' ? localStorage.getItem('cms_patients') || '[]' : '[]';
    let patients: Patient[] = JSON.parse(raw);
    if (query) {
      const q = query.toLowerCase();
      patients = patients.filter(p => p.name.toLowerCase().includes(q) || p.phone.includes(q));
    }
    return patients.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getPatientById(id: string): Promise<Patient | null> {
    if (isSupabaseConfigured) {
      const userId = await getCurrentUserId();
      let req = supabase.from('patients').select('*').eq('id', id);
      if (userId) {
        req = req.eq('created_by', userId);
      }
      const { data, error } = await req.maybeSingle();
      if (!error && data) return data as Patient;
      console.warn('Supabase getPatientById error:', error);
    }
    initializeLocalStorage();
    const raw = typeof window !== 'undefined' ? localStorage.getItem('cms_patients') || '[]' : '[]';
    return (JSON.parse(raw) as Patient[]).find(p => p.id === id) || null;
  },

  async addPatient(patient: Omit<Patient, 'id' | 'created_at'>): Promise<Patient> {
    if (isSupabaseConfigured) {
      const userId = await getCurrentUserId();
      const payload = userId ? { ...patient, created_by: userId } : patient;
      const { data, error } = await supabase.from('patients').insert([payload]).select().single();
      if (!error && data) return data as Patient;
      console.warn('Supabase addPatient error:', error);
    }
    const newPatient: Patient = {
      ...patient,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    initializeLocalStorage();
    const raw = typeof window !== 'undefined' ? localStorage.getItem('cms_patients') || '[]' : '[]';
    const patients: Patient[] = JSON.parse(raw);
    patients.push(newPatient);
    if (typeof window !== 'undefined') localStorage.setItem('cms_patients', JSON.stringify(patients));
    return newPatient;
  },

  async updatePatient(id: string, updates: Partial<Omit<Patient, 'id' | 'created_at'>>): Promise<Patient | null> {
    if (isSupabaseConfigured) {
      const userId = await getCurrentUserId();
      let req = supabase.from('patients').update(updates).eq('id', id);
      if (userId) {
        req = req.eq('created_by', userId);
      }
      const { data, error } = await req.select().single();
      if (!error && data) return data as Patient;
      console.warn('Supabase updatePatient error:', error);
    }
    initializeLocalStorage();
    const raw = typeof window !== 'undefined' ? localStorage.getItem('cms_patients') || '[]' : '[]';
    const patients: Patient[] = JSON.parse(raw);
    const idx = patients.findIndex(p => p.id === id);
    if (idx !== -1) {
      patients[idx] = { ...patients[idx], ...updates };
      if (typeof window !== 'undefined') localStorage.setItem('cms_patients', JSON.stringify(patients));
      return patients[idx];
    }
    return null;
  },

  async deletePatient(id: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      const userId = await getCurrentUserId();
      let req = supabase.from('patients').delete().eq('id', id);
      if (userId) {
        req = req.eq('created_by', userId);
      }
      const { error } = await req;
      if (!error) return true;
      console.warn('Supabase deletePatient error:', error);
    }
    initializeLocalStorage();
    const raw = typeof window !== 'undefined' ? localStorage.getItem('cms_patients') || '[]' : '[]';
    const patients: Patient[] = JSON.parse(raw);
    const filtered = patients.filter(p => p.id !== id);
    if (typeof window !== 'undefined') localStorage.setItem('cms_patients', JSON.stringify(filtered));
    return true;
  },

  // ── VISITS ────────────────────────────────────────────────────────────────
  async getVisits(patientId: string): Promise<Visit[]> {
    if (isSupabaseConfigured) {
      const userId = await getCurrentUserId();
      let req = supabase
        .from('visits')
        .select('*')
        .eq('patient_id', patientId);
      if (userId) {
        req = req.eq('created_by', userId);
      }
      const { data, error } = await req.order('date', { ascending: false });
      if (!error && data) return data as Visit[];
      console.warn('Supabase getVisits error:', error);
    }
    initializeLocalStorage();
    const raw = typeof window !== 'undefined' ? localStorage.getItem('cms_visits') || '[]' : '[]';
    return (JSON.parse(raw) as Visit[])
      .filter(v => v.patient_id === patientId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async addVisit(
    visit: Omit<Visit, 'id' | 'created_at' | 'date'>,
    financeData: { consult_fee: number; med_cost: number }
  ): Promise<{ visit: Visit; finance: Finance }> {
    if (isSupabaseConfigured) {
      const userId = await getCurrentUserId();
      const visitPayload = userId ? { ...visit, created_by: userId } : visit;
      // Insert visit (date defaults to CURRENT_DATE in Postgres)
      const { data: vData, error: vError } = await supabase
        .from('visits')
        .insert([visitPayload])
        .select()
        .single();

      if (!vError && vData) {
        // Insert finance (total & remaining are GENERATED columns — do NOT send them)
        const financePayload = {
          visit_id: vData.id,
          consult_fee: financeData.consult_fee,
          med_cost: financeData.med_cost,
          paid: 0,
          status: 'Pending' as const,
          ...(userId ? { created_by: userId } : {})
        };
        const { data: fData, error: fError } = await supabase
          .from('finance')
          .insert([financePayload])
          .select()
          .single();

        if (!fError && fData) {
          return { visit: vData as Visit, finance: fData as Finance };
        }
        console.warn('Supabase addFinance error:', fError);
      } else {
        console.warn('Supabase addVisit error:', vError);
      }
    }

    // LocalStorage fallback
    const visitId = crypto.randomUUID();
    const financeId = crypto.randomUUID();
    const newVisit: Visit = {
      ...visit,
      id: visitId,
      date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    };
    const total = financeData.consult_fee + financeData.med_cost;
    const newFinance: Finance = {
      id: financeId,
      visit_id: visitId,
      consult_fee: financeData.consult_fee,
      med_cost: financeData.med_cost,
      total,
      paid: 0,
      remaining: total,
      status: 'Pending',
      created_at: new Date().toISOString(),
    };
    initializeLocalStorage();
    const vRaw = typeof window !== 'undefined' ? localStorage.getItem('cms_visits') || '[]' : '[]';
    const fRaw = typeof window !== 'undefined' ? localStorage.getItem('cms_finances') || '[]' : '[]';
    const visits: Visit[] = JSON.parse(vRaw);
    const finances: Finance[] = JSON.parse(fRaw);
    visits.push(newVisit);
    finances.push(newFinance);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cms_visits', JSON.stringify(visits));
      localStorage.setItem('cms_finances', JSON.stringify(finances));
    }
    return { visit: newVisit, finance: newFinance };
  },

  // ── FINANCE ───────────────────────────────────────────────────────────────
  async getFinanceRecords(): Promise<Finance[]> {
    if (isSupabaseConfigured) {
      const userId = await getCurrentUserId();
      let req = supabase
        .from('finance')
        .select(`
          *,
          visits (
            date,
            patients ( name )
          )
        `);
      if (userId) {
        req = req.eq('created_by', userId);
      }
      const { data, error } = await req.order('created_at', { ascending: false });

      if (!error && data) {
        return data.map((f: any) => ({
          id: f.id,
          visit_id: f.visit_id,
          consult_fee: Number(f.consult_fee),
          med_cost: Number(f.med_cost),
          total: Number(f.total),
          paid: Number(f.paid),
          remaining: Number(f.remaining),
          status: f.status as Finance['status'],
          created_at: f.created_at,
          patient_name: f.visits?.patients?.name || 'Unknown Patient',
          visit_date: f.visits?.date || f.created_at,
        }));
      }
      console.warn('Supabase getFinanceRecords error:', error);
    }

    initializeLocalStorage();
    const fRaw = typeof window !== 'undefined' ? localStorage.getItem('cms_finances') || '[]' : '[]';
    const vRaw = typeof window !== 'undefined' ? localStorage.getItem('cms_visits') || '[]' : '[]';
    const pRaw = typeof window !== 'undefined' ? localStorage.getItem('cms_patients') || '[]' : '[]';
    const finances: Finance[] = JSON.parse(fRaw);
    const visits: Visit[] = JSON.parse(vRaw);
    const patients: Patient[] = JSON.parse(pRaw);
    return finances
      .map(f => {
        const visit = visits.find(v => v.id === f.visit_id);
        const patient = visit ? patients.find(p => p.id === visit.patient_id) : null;
        return { ...f, patient_name: patient?.name || 'Unknown', visit_date: visit?.date || f.created_at };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async updateFinancePayment(financeId: string, additionalPaid: number): Promise<Finance | null> {
    if (isSupabaseConfigured) {
      const userId = await getCurrentUserId();
      let selectReq = supabase.from('finance').select('*').eq('id', financeId);
      if (userId) {
        selectReq = selectReq.eq('created_by', userId);
      }
      const { data: current } = await selectReq.single();
      if (current) {
        const newPaid = Number(current.paid) + additionalPaid;
        const total = Number(current.total);
        let newStatus: Finance['status'] = 'Pending';
        if (newPaid >= total) newStatus = 'Paid';
        else if (newPaid > 0) newStatus = 'Partial';

        // NOTE: 'total' and 'remaining' are GENERATED columns — cannot update them
        let updateReq = supabase
          .from('finance')
          .update({ paid: newPaid, status: newStatus })
          .eq('id', financeId);
        if (userId) {
          updateReq = updateReq.eq('created_by', userId);
        }
        const { data, error } = await updateReq
          .select()
          .single();
        if (!error && data) return data as Finance;
        console.warn('Supabase updateFinancePayment error:', error);
      }
    }

    initializeLocalStorage();
    const fRaw = typeof window !== 'undefined' ? localStorage.getItem('cms_finances') || '[]' : '[]';
    const finances: Finance[] = JSON.parse(fRaw);
    const idx = finances.findIndex(f => f.id === financeId);
    if (idx !== -1) {
      const f = finances[idx];
      const newPaid = Number(f.paid) + additionalPaid;
      const total = Number(f.total);
      let newStatus: Finance['status'] = 'Pending';
      if (newPaid >= total) newStatus = 'Paid';
      else if (newPaid > 0) newStatus = 'Partial';
      finances[idx] = { ...f, paid: newPaid, remaining: total - newPaid, status: newStatus };
      if (typeof window !== 'undefined') localStorage.setItem('cms_finances', JSON.stringify(finances));
      return finances[idx];
    }
    return null;
  },

  // ── DASHBOARD METRICS ─────────────────────────────────────────────────────
  async getDashboardMetrics() {
    const patients = await this.getPatients();
    const finances = await this.getFinanceRecords();
    let visits: Visit[] = [];

    if (isSupabaseConfigured) {
      const userId = await getCurrentUserId();
      let req = supabase.from('visits').select('*');
      if (userId) {
        req = req.eq('created_by', userId);
      }
      const { data } = await req;
      visits = (data as Visit[]) || [];
    } else {
      const vRaw = typeof window !== 'undefined' ? localStorage.getItem('cms_visits') || '[]' : '[]';
      visits = JSON.parse(vRaw);
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const todayVisits = visits.filter(v => new Date(v.date) >= startOfToday);
    const todayPatientsCount = new Set(todayVisits.map(v => v.patient_id)).size;

    let todayRevenue = 0;
    let monthlyRevenue = 0;
    finances.forEach(f => {
      const d = new Date(f.visit_date || f.created_at);
      if (d >= startOfToday) todayRevenue += Number(f.paid);
      if (d >= startOfMonth) monthlyRevenue += Number(f.paid);
    });

    const recentPatients = patients.slice(0, 5).map(p => {
      const pVisits = visits
        .filter(v => v.patient_id === p.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return {
        id: p.id,
        name: p.name,
        phone: p.phone,
        gender: p.gender,
        age: p.age,
        lastVisit: pVisits.length > 0 ? pVisits[0].date : null,
        lastComplaint: pVisits.length > 0 ? pVisits[0].complaint : 'No visits yet',
      };
    });

    return { totalPatients: patients.length, todayPatients: todayPatientsCount, todayRevenue, monthlyRevenue, recentPatients };
  },
};
