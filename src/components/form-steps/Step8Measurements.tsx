'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFormStore } from '@/stores/formStore';
import { useCallback, useEffect } from 'react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toast } from "react-hot-toast";

// Base Schema (Age and Units)
const baseSchema = z.object({
    units: z.enum(['metric', 'imperial'], { required_error: "Please select units." }),
    age: z.coerce // Use coerce for number conversion from string input
        .number({ required_error: "Age is required", invalid_type_error: "Age must be a number" })
        .min(16, "Must be at least 16").max(100, "Must be 100 or less").positive("Age must be positive"),
});

// Metric Schema Extension
const metricSchema = baseSchema.extend({
    units: z.literal('metric'), // Enforce literal for discriminated union
    height_cm: z.coerce.number().min(100, "Min 100cm").max(250, "Max 250cm").positive("Height must be positive"),
    current_weight_kg: z.coerce.number().min(30, "Min 30kg").max(300, "Max 300kg").positive("Weight must be positive"),
    target_weight_kg: z.coerce.number().min(30, "Min 30kg").max(300, "Max 300kg").positive("Weight must be positive"),
});

// Imperial Schema Extension
const imperialSchema = baseSchema.extend({
    units: z.literal('imperial'), // Enforce literal
    height_ft: z.coerce.number().min(3, "Min 3ft").max(8, "Max 8ft").int("Feet must be a whole number"),
    height_in: z.coerce.number().min(0, "Min 0in").max(11, "Max 11in").int("Inches must be a whole number").optional().nullable(), // Optional inches
    current_weight_lbs: z.coerce.number().min(60, "Min 60lbs").max(660, "Max 660lbs").positive("Weight must be positive"),
    target_weight_lbs: z.coerce.number().min(60, "Min 60lbs").max(660, "Max 660lbs").positive("Weight must be positive"),
});

// Discriminated union: Validation depends on the 'units' field value
const FormSchema = z.discriminatedUnion('units', [
    metricSchema,
    imperialSchema,
], { message: "Please fill in the required fields for the selected unit system." });

type FormData = z.infer<typeof FormSchema>;

type Step8MeasurementsProps = {
  setSubmitHandler: (handler: () => Promise<boolean>) => void;
  isSubmitting: boolean;
};

export default function Step8Measurements({ setSubmitHandler, isSubmitting }: Step8MeasurementsProps) {
    const formData = useFormStore(useCallback((state) => state.formData, []));
    const updateFormData = useFormStore(useCallback((state) => state.updateFormData, []));
    const nextStep = useFormStore(useCallback((state) => state.nextStep, []));

    const form = useForm<FormData>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
             units: formData.units || 'metric',
             age: formData.age || undefined,
             ...(formData.units === 'metric' ? {
                 height_cm: formData.height_cm || undefined,
                 current_weight_kg: formData.current_weight_kg || undefined,
                 target_weight_kg: formData.target_weight_kg || undefined,
                 height_ft: undefined, height_in: undefined, current_weight_lbs: undefined, target_weight_lbs: undefined,
             } : formData.units === 'imperial' ? {
                 height_ft: formData.height_ft || undefined,
                 height_in: formData.height_in || undefined,
                 current_weight_lbs: formData.current_weight_lbs || undefined,
                 target_weight_lbs: formData.target_weight_lbs || undefined,
                 height_cm: undefined, current_weight_kg: undefined, target_weight_kg: undefined,
             } : {
                 units: 'metric', height_cm: undefined, current_weight_kg: undefined, target_weight_kg: undefined,
             }),
        },
        mode: 'onChange',
    });

    const selectedUnit = form.watch('units');

    // Update Zustand store whenever form data changes (validation handled by RHF)
    useEffect(() => {
        const subscription = form.watch((value) => {
            updateFormData(value);
        });
        return () => subscription.unsubscribe();
    }, [form.watch, updateFormData]); // Depend on watch function

    const handleUnitChange = (newUnit: 'metric' | 'imperial') => {
        if (!newUnit) return;
        form.setValue('units', newUnit, { shouldValidate: true });
        if (newUnit === 'metric') {
            form.setValue('height_ft', null as any); form.setValue('height_in', null as any);
            form.setValue('current_weight_lbs', null as any); form.setValue('target_weight_lbs', null as any);
        } else {
            form.setValue('height_cm', null as any); form.setValue('current_weight_kg', null as any);
            form.setValue('target_weight_kg', null as any);
        }
        // Trigger validation for the whole form after clearing
        form.trigger(); 
    };

    // This function is called ONLY if validation passes
    const handleValidSubmit = (data: FormData) => {
        updateFormData(data); // Ensure final data is in store
        nextStep();
    };
    
    // Register the validation/submit handler with the parent component
    useEffect(() => {
        setSubmitHandler(async () => {
          const isValid = await form.trigger();
          if (isValid) {
            await form.handleSubmit(handleValidSubmit)();
            return true;
          } else {
            // Show a general toast or specific errors
            const errors = form.formState.errors;
            let errorMessage = "Please correct the errors in the form.";
            // Example: find the first error message
            const firstErrorKey = Object.keys(errors)[0] as keyof FormData;
            if (firstErrorKey && errors[firstErrorKey]?.message) {
                errorMessage = errors[firstErrorKey]?.message ?? errorMessage;
            }
            toast.error(errorMessage);
            return false;
          }
        });
    }, [setSubmitHandler, form, handleValidSubmit]);

    return (
        <Form {...form}>
            <form className="space-y-6">
                <FormLabel className="text-lg font-semibold">Measurements</FormLabel>

                {/* Unit Toggle Group */}
                <FormField
                    control={form.control}
                    name="units"
                    render={({ field }) => (
                        <FormItem className="flex flex-col items-center">
                            <FormLabel className="mb-2">Units</FormLabel>
                            <FormControl>
                                <ToggleGroup
                                    type="single"
                                    value={field.value}
                                    onValueChange={(value: 'metric' | 'imperial') => {
                                        if (value) { handleUnitChange(value); }
                                    }}
                                    className="border rounded-md overflow-hidden"
                                    disabled={isSubmitting}
                                >
                                    <ToggleGroupItem 
                                      value="metric" 
                                      aria-label="Metric units" 
                                      className={`px-4 py-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground ${isSubmitting ? 'cursor-not-allowed opacity-50' : ''}`}
                                      disabled={isSubmitting}
                                    >
                                        Metric
                                    </ToggleGroupItem>
                                    <ToggleGroupItem 
                                      value="imperial" 
                                      aria-label="Imperial units" 
                                      className={`px-4 py-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground ${isSubmitting ? 'cursor-not-allowed opacity-50' : ''}`}
                                      disabled={isSubmitting}
                                     >
                                        Imperial
                                    </ToggleGroupItem>
                                </ToggleGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Age Input (Common) */}
                <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Age</FormLabel>
                            <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="Your age" 
                                  {...field} 
                                  value={field.value ?? ''} 
                                  disabled={isSubmitting}
                                  className={isSubmitting ? 'bg-gray-100' : ''}
                                 />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Metric Fields */}
                <div className={cn("space-y-4", selectedUnit !== 'metric' && "hidden")}>
                    <FormField
                        control={form.control}
                        name="height_cm"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Height</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input 
                                          type="number" 
                                          placeholder="e.g., 175" 
                                          {...field} 
                                          value={field.value ?? ''} 
                                          required={selectedUnit === 'metric'} 
                                          disabled={isSubmitting}
                                          className={isSubmitting ? 'bg-gray-100' : ''}
                                        />
                                        <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-500 pointer-events-none">cm</span>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="current_weight_kg"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Current Weight</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input 
                                          type="number" 
                                          placeholder="e.g., 70.5" 
                                          step="0.1" 
                                          {...field} 
                                          value={field.value ?? ''} 
                                          required={selectedUnit === 'metric'} 
                                          disabled={isSubmitting}
                                          className={isSubmitting ? 'bg-gray-100' : ''}
                                        />
                                         <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-500 pointer-events-none">kg</span>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="target_weight_kg"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Target Weight</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input 
                                          type="number" 
                                          placeholder="e.g., 65" 
                                          step="0.1" 
                                          {...field} 
                                          value={field.value ?? ''} 
                                          required={selectedUnit === 'metric'} 
                                          disabled={isSubmitting}
                                          className={isSubmitting ? 'bg-gray-100' : ''}
                                         />
                                        <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-500 pointer-events-none">kg</span>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Imperial Fields */} 
                <div className={cn("space-y-4", selectedUnit !== 'imperial' && "hidden")}>
                    <FormItem>
                        <FormLabel>Height</FormLabel>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <FormField
                                control={form.control}
                                name="height_ft"
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormControl>
                                            <div className="relative">
                                                <Input 
                                                  type="number" 
                                                  placeholder="Feet" 
                                                  {...field} 
                                                  value={field.value ?? ''} 
                                                  required={selectedUnit === 'imperial'} 
                                                  disabled={isSubmitting}
                                                  className={isSubmitting ? 'bg-gray-100' : ''}
                                                 />
                                                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-500 pointer-events-none">ft</span>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="height_in"
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormControl>
                                            <div className="relative">
                                                <Input 
                                                  type="number" 
                                                  placeholder="Inches" 
                                                  {...field} 
                                                  value={field.value ?? ''} 
                                                  disabled={isSubmitting}
                                                  className={isSubmitting ? 'bg-gray-100' : ''}
                                                 />
                                                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-500 pointer-events-none">in</span>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </FormItem>
                     <FormField
                        control={form.control}
                        name="current_weight_lbs"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Current Weight</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input 
                                          type="number" 
                                          placeholder="e.g., 155" 
                                          {...field} 
                                          value={field.value ?? ''} 
                                          required={selectedUnit === 'imperial'} 
                                          disabled={isSubmitting}
                                          className={isSubmitting ? 'bg-gray-100' : ''}
                                         />
                                        <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-500 pointer-events-none">lbs</span>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="target_weight_lbs"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Target Weight</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input 
                                          type="number" 
                                          placeholder="e.g., 140" 
                                          {...field} 
                                          value={field.value ?? ''} 
                                          required={selectedUnit === 'imperial'} 
                                          disabled={isSubmitting}
                                          className={isSubmitting ? 'bg-gray-100' : ''}
                                         />
                                        <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-500 pointer-events-none">lbs</span>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </form>
        </Form>
    );
} 