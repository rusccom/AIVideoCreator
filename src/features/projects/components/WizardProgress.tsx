type WizardProgressProps = {
  step: number;
};

const steps = ["Project setup", "Scene idea", "Start frame"];

export function WizardProgress({ step }: WizardProgressProps) {
  return (
    <aside className="wizard-steps">
      {steps.map((label, index) => (
        <div className={index === step ? "wizard-step active" : "wizard-step"} key={label}>
          <strong>{label}</strong>
          <p className="form-note">Step {index + 1}</p>
        </div>
      ))}
    </aside>
  );
}
