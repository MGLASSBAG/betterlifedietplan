import { create } from 'zustand';

// Define the structure of the form data
type FormData = {
  gender: 'male' | 'female' | null;
  familiarity: 'beginner' | 'somewhat_familiar' | 'expert' | null;
  prep_time: '15_mins' | '30_mins' | '60_plus_mins' | null;
  disliked_meats: string[]; // e.g., ['pork', 'beef'] or ['none']
  other_meat_description: string | null; // Description for 'other' meat option
  disliked_ingredients: string[]; // e.g., ['onions', 'eggs'] or ['none']
  other_ingredient_description: string | null; // Description for 'other' ingredient option
  activity_level: 'not_active' | 'moderately_active' | 'very_active' | null;
  health_conditions: string[]; // e.g., ['diabetes'] or ['none']
  other_health_description: string | null; // Description for 'other' health condition
  age: number | null;
  units: 'metric' | 'imperial';
  height_cm: number | null;
  current_weight_kg: number | null;
  target_weight_kg: number | null;
  height_ft: number | null;
  height_in: number | null;
  current_weight_lbs: number | null;
  target_weight_lbs: number | null;
};

type FormState = {
  currentStep: number;
  totalSteps: number;
  formData: Partial<FormData>;
  submitHandler: (() => void) | null;
  updateFormData: (data: Partial<FormData>) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetForm: () => void;
  triggerSubmit: () => void;
  setSubmitHandler: (handler: (() => void) | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
};

const TOTAL_FORM_STEPS = 9;

// Create the simple Zustand store
export const useFormStore = create<FormState>((set, get) => ({
  currentStep: 1,
  totalSteps: TOTAL_FORM_STEPS,
  formData: {},
  submitHandler: null,
  updateFormData: (data) => set((state) => ({
    formData: { ...state.formData, ...data }
  })),
  nextStep: () => set((state) => ({
    currentStep: Math.min(state.currentStep + 1, state.totalSteps)
  })),
  prevStep: () => set((state) => ({
    currentStep: Math.max(state.currentStep - 1, 1)
  })),
  resetForm: () => set({
    currentStep: 1,
    formData: {}
  }),
  triggerSubmit: () => {
    const state = get();
    if (state.submitHandler) {
      state.submitHandler();
    } else {
      console.error("Submit handler not set");
    }
  },
  setSubmitHandler: (handler: (() => void) | null) => set({
    submitHandler: handler
  }),
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading })
}));