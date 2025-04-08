'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFormStore } from '@/stores/formStore';
import { useState, useCallback } from 'react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CheckIcon } from 'lucide-react'; // Import check icon
import { Button } from "@/components/ui/button"; // Import Button component

const ingredientOptions = [
  { id: 'none', label: 'I eat them all' },
  { id: 'onions', label: 'Onions' },
  { id: 'mushrooms', label: 'Mushrooms' },
  { id: 'eggs', label: 'Eggs' },
  { id: 'nuts', label: 'Nuts' },
  { id: 'cheese', label: 'Cheese' },
  { id: 'milk', label: 'Milk' },
  { id: 'avocados', label: 'Avocados' },
  { id: 'seafood', label: 'Seafood' },
  { id: 'olives', label: 'Olives' },
  { id: 'capers', label: 'Capers' },
  { id: 'coconut', label: 'Coconut' },
  { id: 'goat_cheese', label: 'Goat cheese' },
];

// Schema for Step 5
const FormSchema = z.object({
  disliked_ingredients: z.array(z.string()).refine((value) => value.length > 0, {
    message: "You have to select at least one option.",
  }),
});

type FormData = z.infer<typeof FormSchema>;

export default function Step5Ingredients() {
  // Get data and update function from the store
  const formData = useFormStore(useCallback((state) => state.formData, []));
  const updateFormData = useFormStore(useCallback((state) => state.updateFormData, []));
  const nextStep = useFormStore(useCallback((state) => state.nextStep, []));

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      disliked_ingredients: formData.disliked_ingredients || [],
    },
  });

  const handleCheckboxChange = (
    checked: boolean | 'indeterminate',
    optionId: string,
    currentSelection: string[],
    onChange: (value: string[]) => void
  ) => {
    let newSelection: string[] = [];
    const isNone = optionId === 'none';

    if (checked) {
      if (isNone) {
        newSelection = ['none']; // Select 'none', clear others
      } else {
        // Select a specific ingredient: add it and remove 'none'
        newSelection = [...currentSelection.filter(id => id !== 'none'), optionId];
      }
    } else {
      // Deselect item
      newSelection = currentSelection.filter((value) => value !== optionId);
      // Optional: If unchecking the last item, default back to 'none'?
      // if (newSelection.length === 0) { 
      //   newSelection = ['none']; 
      // }
    }
    onChange(newSelection); // Update RHF
    updateFormData({ disliked_ingredients: newSelection }); // Update Zustand
  };

  const onSubmit = (data: FormData) => {
    // Ensure data is saved to the store
    updateFormData({ disliked_ingredients: data.disliked_ingredients });
    // Move to the next step
    nextStep();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} id="ingredients-form" className="space-y-4">
        <FormField
          control={form.control}
          name="disliked_ingredients"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className="text-lg font-semibold">Which ingredients you DON'T LIKE?</FormLabel>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ingredientOptions.map((option) => (
                  <Label
                    key={option.id}
                    htmlFor={`ingredient-${option.id}`}
                    className="flex items-center space-x-3 p-4 border rounded-md cursor-pointer hover:bg-accent transition-colors has-[input:checked]:border-primary has-[input:checked]:bg-primary/10"
                  >
                    <FormControl>
                      <Checkbox
                        id={`ingredient-${option.id}`}
                        checked={field.value?.includes(option.id)}
                        onCheckedChange={(checked) => {
                          handleCheckboxChange(checked, option.id, field.value || [], field.onChange);
                        }}
                        className="hidden" // Hide actual checkbox
                      />
                    </FormControl>
                    {/* Custom checkbox visual */}
                    <div className="w-4 h-4 border rounded-sm mr-2 flex items-center justify-center ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary">
                      {field.value?.includes(option.id) && <CheckIcon className="h-3 w-3" />} 
                    </div>
                    <span className="font-normal flex-1">{option.label}</span>
                  </Label>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
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