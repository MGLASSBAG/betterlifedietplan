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
import { Button } from "@/components/ui/button";

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

export default function Step8Measurements() {
    const formData = useFormStore(useCallback((state) => state.formData, []));
    const updateFormData = useFormStore(useCallback((state) => state.updateFormData, []));
    const nextStep = useFormStore(useCallback((state) => state.nextStep, []));

    const form = useForm<FormData>({
        resolver: zodResolver(FormSchema),
        // Initialize based on store data OR default to metric
        defaultValues: {
            units: formData.units || 'metric',
            age: formData.age || undefined,
            // Conditionally set defaults based on stored unit
            ...(formData.units === 'metric' ? {
                height_cm: formData.height_cm || undefined,
                current_weight_kg: formData.current_weight_kg || undefined,
                target_weight_kg: formData.target_weight_kg || undefined,
                height_ft: undefined, // Clear other unit defaults
                height_in: undefined,
                current_weight_lbs: undefined,
                target_weight_lbs: undefined,
            } : formData.units === 'imperial' ? {
                height_ft: formData.height_ft || undefined,
                height_in: formData.height_in || undefined,
                current_weight_lbs: formData.current_weight_lbs || undefined,
                target_weight_lbs: formData.target_weight_lbs || undefined,
                height_cm: undefined, // Clear other unit defaults
                current_weight_kg: undefined,
                target_weight_kg: undefined,
            } : { // Default case (no units stored yet, assume metric)
                units: 'metric', 
                height_cm: undefined,
                current_weight_kg: undefined,
                target_weight_kg: undefined,
            }),
        },
        mode: 'onChange', // Validate on change for better UX with inputs
    });

    // Get the current unit value from the form state
    const selectedUnit = form.watch('units');

    // Update Zustand store whenever form data changes and is valid
    useEffect(() => {
        const subscription = form.watch((value) => {
             FormSchema.safeParseAsync(value).then(result => {
                if (result.success) {
                    // Only update zustand if data has meaningfully changed
                    const currentState = useFormStore.getState().formData || {};
                    // Basic check - could use deep compare if needed
                    if (JSON.stringify(currentState) !== JSON.stringify(result.data)) {
                         updateFormData(result.data);
                    }
                } // else: let RHF handle showing validation errors
            });
        });
        return () => subscription.unsubscribe();
    }, [form, updateFormData]); // Depend on form object and update function

    // Handle unit switching: Update RHF, clear unused fields, trigger validation
    const handleUnitChange = (newUnit: 'metric' | 'imperial') => {
        if (!newUnit) return; // Prevent issues if value is empty

        form.setValue('units', newUnit, { shouldValidate: true }); // Update RHF field state
        
        // Clear the values for the *other* unit system
        if (newUnit === 'metric') {
            form.setValue('height_ft', null as any);
            form.setValue('height_in', null as any);
            form.setValue('current_weight_lbs', null as any);
            form.setValue('target_weight_lbs', null as any);
        } else {
            form.setValue('height_cm', null as any);
            form.setValue('current_weight_kg', null as any);
            form.setValue('target_weight_kg', null as any);
        }
    };

    const onSubmit = (data: FormData) => {
        // Ensure final data is in store
        updateFormData(data);
        nextStep();
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                                        field.onChange(value); // Update RHF field state
                                        handleUnitChange(value); // Perform unit switching logic
                                    }}
                                    className="border rounded-md overflow-hidden"
                                >
                                    <ToggleGroupItem value="metric" aria-label="Metric units" className="px-4 py-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                                        Metric
                                    </ToggleGroupItem>
                                    <ToggleGroupItem value="imperial" aria-label="Imperial units" className="px-4 py-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
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
                                {/* Ensure input type is "number" for coercing */}
                                <Input type="number" placeholder="Your age" {...field} value={field.value ?? ''} />
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
                                        <Input type="number" placeholder="e.g., 175" {...field} value={field.value ?? ''} required={selectedUnit === 'metric'} />
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
                                        <Input type="number" placeholder="e.g., 70.5" step="0.1" {...field} value={field.value ?? ''} required={selectedUnit === 'metric'} />
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
                                        <Input type="number" placeholder="e.g., 65" step="0.1" {...field} value={field.value ?? ''} required={selectedUnit === 'metric'} />
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
                        <div className="flex gap-4">
                            <FormField
                                control={form.control}
                                name="height_ft"
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormControl>
                                            <div className="relative">
                                                <Input type="number" placeholder="Feet" {...field} value={field.value ?? ''} required={selectedUnit === 'imperial'} />
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
                                                <Input type="number" placeholder="Inches" {...field} value={field.value ?? ''} />
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
                                        <Input type="number" placeholder="e.g., 155" {...field} value={field.value ?? ''} required={selectedUnit === 'imperial'} />
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
                                        <Input type="number" placeholder="e.g., 140" {...field} value={field.value ?? ''} required={selectedUnit === 'imperial'} />
                                        <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-500 pointer-events-none">lbs</span>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                
                {/* Add Continue Button */}
                <Button 
                  type="submit" 
                  className="w-full mt-6 bg-red-600 hover:bg-red-700"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? 'Processing...' : 'Continue'}
                </Button>
            </form>
        </Form>
    );
} 