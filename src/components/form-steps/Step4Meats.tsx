'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFormStore } from '@/stores/formStore';
import { upsertProfileData } from '@/app/actions/profileActions';
import { useAuth } from '@/hooks/useAuth';
import { useCallback } from 'react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "react-hot-toast";
import { Label } from "@/components/ui/label";
import { CheckIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";

const meatOptions = [
  { id: 'none', label: 'I eat all meats' },
  { id: 'poultry', label: 'Poultry' },
  { id: 'pork', label: 'Pork' },
  { id: 'beef', label: 'Beef' },
  { id: 'fish', label: 'Fish' },
  { id: 'lamb', label: 'Lamb' },
  { id: 'veal', label: 'Veal' },
  { id: 'vegetarian', label: 'I am vegetarian' },
];

// Schema for Step 4
const FormSchema = z.object({
  disliked_meats: z.array(z.string()).refine((value) => value.length > 0, {
    message: "You have to select at least one option.",
  }),
});

type FormData = z.infer<typeof FormSchema>;

const Step4Meats = () => {
  const formData = useFormStore((state) => state.formData);
  const updateFormData = useFormStore((state) => state.updateFormData);
  const nextStep = useFormStore((state) => state.nextStep);
  const user = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      disliked_meats: formData.disliked_meats || [],
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
    const isVegetarian = optionId === 'vegetarian';

    if (checked) {
      if (isNone) {
        newSelection = ['none']; // Select 'none', clear others
      } else if (isVegetarian) {
        newSelection = ['vegetarian']; // Select 'vegetarian', clear others
      } else {
        // Select a specific meat: add it, remove 'none' and 'vegetarian'
        newSelection = [...currentSelection.filter(id => id !== 'none' && id !== 'vegetarian'), optionId];
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
    updateFormData({ disliked_meats: newSelection }); // Update Zustand
  };

  const onSubmit = (data: FormData) => {
    updateFormData({ disliked_meats: data.disliked_meats }); 
    nextStep(); // Always proceed to the next step

    // Optionally save data if user is logged in (fire-and-forget, don't block UI)
    if (user && user.id) {
      upsertProfileData(user.id, { disliked_meats: data.disliked_meats })
        .then(result => {
          if (!result.success) {
            console.error("Failed to save Step 4 data silently:", result.error);
            // Maybe show a non-blocking toast later if needed
          }
        })
        .catch(error => {
           console.error("Error during silent save for Step 4:", error);
        });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} id="step-form" className="space-y-6">
        <h2 className="text-xl font-semibold mb-4">Which meats you DON'T LIKE?</h2>
        <FormField
          control={form.control}
          name="disliked_meats"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {meatOptions.map((option) => (
                  <Label
                    key={option.id}
                    htmlFor={`meat-${option.id}`}
                    className="flex items-center space-x-3 p-4 border rounded-md cursor-pointer hover:bg-accent transition-colors has-[input:checked]:border-primary has-[input:checked]:bg-primary/10"
                  >
                    <FormControl>
                      <Checkbox
                        id={`meat-${option.id}`}
                        checked={field.value?.includes(option.id)}
                        onCheckedChange={(checked) => {
                          handleCheckboxChange(checked, option.id, field.value || [], field.onChange);
                        }}
                        className="hidden"
                      />
                    </FormControl>
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
};

export default Step4Meats; 