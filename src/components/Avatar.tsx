const Avatar = ({ name, size = 48 }: { name: string; size?: number }) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className="flex items-center justify-center rounded-full bg-coral font-display font-bold text-secondary-foreground"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
};

export default Avatar;
