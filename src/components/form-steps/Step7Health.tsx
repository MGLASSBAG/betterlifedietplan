'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFormStore } from '@/stores/formStore';
import { useCallback } from 'react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CheckIcon } from 'lucide-react'; // Import check icon

const healthOptions = [
    { id: 'none', label: 'None of the above' },
    { id: 'diabetes', label: 'Diabetes (any stage)' },
    { id: 'kidney_disease', label: 'Kidney disease or issues' },
    { id: 'liver_disease', label: 'Liver disease or issues' },
    { id: 'pancreas_disease', label: 'Pancreas disease or issues' },
    { id: 'recovering_surgery', label: 'I am recovering from surgery' },
    { id: 'mental_health', label: 'Mental health issues' },
    { id: 'cancer', label: 'Cancer' },
    { id: 'heart_disease_stroke', label: 'Heart disease or stroke' },
    { id: 'high_blood_pressure', label: 'High blood pressure' },
    { id: 'thyroid_issues', label: 'Thyroid issues' },
    { id: 'high_cholesterol', label: 'High cholesterol' },
    { id: 'other', label: 'Other health issues' },
];

// Schema for Step 7
const FormSchema = z.object({
  health_conditions: z.array(z.string()).refine((value) => value.length > 0, {
    message: "You have to select at least one option.",
  }),
});

type FormData = z.infer<typeof FormSchema>;

export default function Step7Health() {
  // Get data and update function from the store
  const formData = useFormStore(useCallback((state) => state.formData, []));
  const updateFormData = useFormStore(useCallback((state) => state.updateFormData, []));

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      health_conditions: formData.health_conditions || [],
    },
  });

  // Remove useEffect hook

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
        // Select a specific condition: add it and remove 'none'
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
    updateFormData({ health_conditions: newSelection }); // Update Zustand
  };

  return (
    <Form {...form}>
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="health_conditions"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className="text-lg font-semibold">Does any of the following apply for you?</FormLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {healthOptions.map((option) => (
                  <Label
                    key={option.id}
                    htmlFor={`health-${option.id}`}
                    className="flex items-center space-x-3 p-4 border rounded-md cursor-pointer hover:bg-accent transition-colors has-[input:checked]:border-primary has-[input:checked]:bg-primary/10"
                  >
                    <FormControl>
                      <Checkbox
                        id={`health-${option.id}`}
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
      </div>
    </Form>
  );
} 