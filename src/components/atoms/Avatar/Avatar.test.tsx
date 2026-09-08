import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import Avatar from "./Avatar";

describe("Avatar fallback chain (photo -> DiceBear -> initials)", () => {
  it("renders the given photo src first when one is supplied", () => {
    const { container } = render(<Avatar name="Asha Patel" seed={42} src="https://example.com/photo.jpg" />);
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("src", "https://example.com/photo.jpg");
  });

  it("falls back to a seeded DiceBear illustration when the photo fails to load", () => {
    const { container } = render(<Avatar name="Asha Patel" seed={42} src="https://example.com/photo.jpg" />);
    const img = container.querySelector("img") as HTMLImageElement;

    fireEvent.error(img);

    const generatedImg = container.querySelector("img") as HTMLImageElement;
    expect(generatedImg.src).toContain("api.dicebear.com");
    expect(generatedImg.src).toContain("seed=42");
  });

  it("falls back to a deterministic solid-color initials avatar when DiceBear also fails", () => {
    const { container } = render(<Avatar name="Asha Patel" seed={42} src="https://example.com/photo.jpg" />);
    const img = container.querySelector("img") as HTMLImageElement;

    fireEvent.error(img); // photo -> generated
    fireEvent.error(container.querySelector("img") as HTMLImageElement); // generated -> initials

    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(container.textContent).toBe("AP");
  });

  it("skips straight to the generated illustration when no photo src is given", () => {
    const { container } = render(<Avatar name="Ravi Shah" seed={7} />);
    const img = container.querySelector("img") as HTMLImageElement;
    expect(img.src).toContain("api.dicebear.com");
    expect(img.src).toContain("seed=7");
  });

  it("prefers the numeric/string seed over the name so a renamed user keeps the same look", () => {
    const { container: byName } = render(<Avatar name="Same Person" seed="user-99" />);
    const { container: byNameChanged } = render(<Avatar name="Different Name" seed="user-99" />);
    const imgA = byName.querySelector("img") as HTMLImageElement;
    const imgB = byNameChanged.querySelector("img") as HTMLImageElement;
    expect(imgA.src).toBe(imgB.src);
  });

  it("produces a stable (deterministic) initials-avatar color across renders for the same seed", () => {
    const render1 = render(<Avatar name="Asha Patel" seed={42} />);
    fireEvent.error(render1.container.querySelector("img") as HTMLImageElement);
    const class1 = (render1.container.firstChild as HTMLElement).className;

    const render2 = render(<Avatar name="Asha Patel" seed={42} />);
    fireEvent.error(render2.container.querySelector("img") as HTMLImageElement);
    const class2 = (render2.container.firstChild as HTMLElement).className;

    // Emotion's sx-generated class name is itself a hash of the style rules (including
    // bgcolor), so identical classNames across two independent renders is proof the same
    // color was picked both times for the same seed.
    expect(class1).toBe(class2);
    expect(class1).toContain("css-");
  });

  it("falls back to '?' initials when no name is given at all", () => {
    const { container } = render(<Avatar seed={1} />);
    fireEvent.error(container.querySelector("img") as HTMLImageElement);
    expect(container.textContent).toBe("?");
  });
});
