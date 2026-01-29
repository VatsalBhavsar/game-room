import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card.jsx";
import { Button } from "../components/ui/button.jsx";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col gap-10">
      <header className="flex flex-col gap-4">
        <p className="text-xs uppercase tracking-[0.4em] text-white/50">
          On-call mini games
        </p>
        <h1 className="text-5xl font-bold">Game Room</h1>
        <p className="max-w-2xl text-lg text-white/70">
          Spin up a lightning-fast quiz or typing round. The host controls the flow,
          players race to submit, and the scoreboard updates instantly.
        </p>
      </header>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create a room</CardTitle>
            <CardDescription>Host a new game with your own settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/create">Create Room</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Join a room</CardTitle>
            <CardDescription>Jump into an existing game in seconds.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" asChild>
              <Link to="/join">Join Room</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
