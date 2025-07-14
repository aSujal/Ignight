import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export function ClueInput({ onSubmit }: { onSubmit: (clue: string) => void }) {
  const [clue, setClue] = useState("");

  const handle = () => {
    if (clue.trim()) {
      onSubmit(clue.trim());
      setClue("");
    }
  };

  return (
    <div className="flex gap-3 items-center">
      <Input
        value={clue}
        onChange={(e) => setClue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handle()}
        placeholder="Enter one-word clue..."
      />
      <Button onClick={handle} disabled={!clue.trim()}>
        Submit
      </Button>
    </div>
  );
}
