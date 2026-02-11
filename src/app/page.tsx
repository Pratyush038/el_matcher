"use client";

import Link from "next/link";
import { ArrowRight, Users, Shield, Target, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Squares from "@/components/ui/squares-background";
import { ModeToggle } from "@/components/global/theme-switcher";

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Squares
          speed={0.5}
          squareSize={40}
          direction="diagonal"
        />
      </div>

      <div className="relative z-10">
        {/* Theme Toggle */}
        <div className="absolute top-4 right-4">
          <ModeToggle />
        </div>

        {/* Hero */}
        <div className="max-w-4xl mx-auto px-4 pt-32 pb-24 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-300/10 border border-amber-300/20 text-amber-700 dark:text-amber-300 text-sm font-medium px-5 py-2 rounded-full mb-8 tracking-wide">
            <Users size={16} />
            RVCE EL Team Matchmaking
          </div>
          <h1 className="text-6xl md:text-7xl font-bold mb-4 leading-[1.1] tracking-tight">
            RVCE{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-orange-500 dark:from-amber-300 dark:to-orange-400">
              EL Matcher
            </span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto mb-4 font-light">
            Find your EL project team.
          </p>
          <p className="text-muted-foreground/70 text-sm max-w-lg mx-auto mb-12 font-light leading-relaxed">
            Create teams, join with invite codes, and find the right teammates
            &mdash; all with cluster constraints built in.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" className="rounded-full px-8 font-semibold" asChild>
              <Link href="/register">
                Get Started <ArrowRight size={18} className="ml-2" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="rounded-full px-8 font-semibold" asChild>
              <Link href="/signin">Sign In</Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="max-w-5xl mx-auto px-4 pb-24">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <Zap className="text-amber-600 dark:text-amber-300 mb-3" size={28} />
                <h3 className="font-semibold text-lg mb-1 tracking-tight">Invite Codes</h3>
                <p className="text-sm text-muted-foreground">
                  Create a team, get a code, share it. Friends join instantly.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <Shield className="text-amber-600 dark:text-amber-400 mb-3" size={28} />
                <h3 className="font-semibold text-lg mb-1 tracking-tight">Cluster Constraints</h3>
                <p className="text-sm text-muted-foreground">
                  Set limits per cluster. The system enforces them automatically.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <Target className="text-orange-600 dark:text-orange-300 mb-3" size={28} />
                <h3 className="font-semibold text-lg mb-1 tracking-tight">Browse &amp; Match</h3>
                <p className="text-sm text-muted-foreground">
                  Post what your team needs. Find teams looking for your branch.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Steps */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-center mb-10 tracking-tight">
              How It Works
            </h2>
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { step: "1", title: "Sign Up", desc: "Use your RVCE email & USN" },
                { step: "2", title: "Create or Join", desc: "Start a team or enter an invite code" },
                { step: "3", title: "Set Requirements", desc: "Specify clusters & branches needed" },
                { step: "4", title: "Connect", desc: "Find teammates and reach out" },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold mx-auto mb-3">
                    {item.step}
                  </div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
