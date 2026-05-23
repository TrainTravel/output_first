import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, ArrowRight, X, Check, Sparkles, Pause } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';

type Phase = 'dumping' | 'sorting' | 'reflecting';
type Bucket = 'unsorted' | 'yes' | 'expand' | 'notnow';

interface RequestCard {
  id: string;
  text: string;
  bucket: Bucket;
}

interface RequestFilterTabProps {
  onSelectGoal: (goal: string) => void;
}

/* ── Draggable Card ── */
function DraggableCard({ card, compact }: { card: RequestCard; compact?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
  });

  const style = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`px-3 py-2 rounded-xl bg-card border border-border text-foreground cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md ${
        compact ? 'text-xs' : 'text-sm'
      }`}
    >
      {card.text}
    </div>
  );
}

/* ── Drop Zone ── */
function DropZone({
  bucket,
  label,
  icon,
  cards,
  colorClass,
}: {
  bucket: Bucket;
  label: string;
  icon: React.ReactNode;
  cards: RequestCard[];
  colorClass: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `zone-${bucket}` });

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-h-[100px] rounded-2xl border-2 border-dashed p-3 space-y-2 transition-colors ${colorClass} ${
        isOver ? 'ring-2 ring-primary/40 scale-[1.02]' : ''
      }`}
    >
      <div className="flex items-center gap-1.5 text-xs font-medium opacity-70 mb-1">
        {icon}
        {label}
      </div>
      {cards.map((card) => (
        <DraggableCard key={card.id} card={card} compact />
      ))}
    </div>
  );
}

export function RequestFilterTab({ onSelectGoal }: RequestFilterTabProps) {
  const { t } = useLanguage();

  const [phase, setPhase] = useState<Phase>('dumping');
  const [cards, setCards] = useState<RequestCard[]>([]);
  const [newText, setNewText] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pickIndex, setPickIndex] = useState(0);
  const [showAllYes, setShowAllYes] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const placeholders = [
    t({ fr: 'Répondre au courriel du patron', en: 'Reply to boss email', es: 'Responder al correo del jefe' }).primary,
    t({ fr: 'Finir le ménage', en: 'Finish laundry', es: 'Terminar la colada' }).primary,
    t({ fr: 'Appeler le dentiste', en: 'Call the dentist', es: 'Llamar al dentista' }).primary,
    t({ fr: 'Préparer le souper', en: 'Make dinner', es: 'Preparar la cena' }).primary,
    t({ fr: 'Payer les factures', en: 'Pay bills', es: 'Pagar las facturas' }).primary,
    t({ fr: 'Répondre à ce message', en: 'Reply to that text', es: 'Responder a ese mensaje' }).primary,
    t({ fr: 'Ranger le bureau', en: 'Tidy the desk', es: 'Ordenar el escritorio' }).primary,
    t({ fr: 'Acheter des courses', en: 'Buy groceries', es: 'Comprar comestibles' }).primary,
  ];

  const addCard = () => {
    if (!newText.trim() || cards.length >= 8) return;
    setCards((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text: newText.trim(), bucket: 'unsorted' },
    ]);
    setNewText('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const byBucket = (b: Bucket) => cards.filter((c) => c.bucket === b);

  /* ── Drag handlers ── */
  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;

    const overId = String(over.id);
    // Check if dropped over a bucket zone
    const bucketTargets: Bucket[] = ['yes', 'expand', 'notnow', 'unsorted'];
    const targetBucket = bucketTargets.find((b) => overId === `zone-${b}`) ?? null;

    if (targetBucket) {
      setCards((prev) =>
        prev.map((c) => (c.id === String(active.id) ? { ...c, bucket: targetBucket } : c))
      );
    } else {
      // Dropped on another card — find that card's bucket
      const targetCard = cards.find((c) => c.id === overId);
      if (targetCard) {
        setCards((prev) =>
          prev.map((c) =>
            c.id === String(active.id) ? { ...c, bucket: targetCard.bucket } : c
          )
        );
      }
    }
  };

  const activeCard = cards.find((c) => c.id === activeId);
  const allSorted = cards.length > 0 && byBucket('unsorted').length === 0;

  /* ── Phase: DUMPING ── */
  if (phase === 'dumping') {
    return (
      <div className="space-y-6 text-center animate-fade-in-up">
        <div>
          <p className="font-serif text-lg text-foreground">
            {t(
              { fr: 'Qu\'est-ce qui pèse en ce moment ?', en: 'What\'s weighing on you right now?', es: '¿Qué te pesa en este momento?' }
            ).primary}
          </p>
          <p className="text-sm text-muted-foreground italic mt-1">
            {t(
              { fr: 'Qu\'est-ce qui pèse en ce moment ?', en: 'What\'s weighing on you right now?', es: '¿Qué te pesa en este momento?' }
            ).secondary}
          </p>
        </div>

        {/* Card list */}
        <div className="space-y-2">
          {cards.map((card, i) => (
            <div
              key={card.id}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-card border border-border animate-fade-in-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <span className="text-foreground text-sm flex-1 text-left">{card.text}</span>
              <button
                onClick={() => setCards((prev) => prev.filter((c) => c.id !== card.id))}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Input */}
        {cards.length < 8 && (
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCard()}
              placeholder={placeholders[cards.length] ?? placeholders[0]}
              className="flex-1 text-sm"
              autoFocus
            />
            <Button variant="outline" size="icon" onClick={addCard} disabled={!newText.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        )}

        {cards.length >= 8 && (
          <p className="text-xs text-muted-foreground/60">
            {t({ fr: '8 max — on garde ça gérable', en: '8 max — keeping it manageable', es: '8 máx — manteniéndolo manejable' }).primary}
          </p>
        )}

        {/* Continue */}
        {cards.length >= 2 && (
          <Button variant="default" onClick={() => setPhase('sorting')}>
            <ArrowRight className="w-4 h-4 mr-1" />
            {t({ fr: 'Trier', en: 'Sort', es: 'Clasificar' }).primary}
          </Button>
        )}

        <p className="text-xs text-muted-foreground/50">
          {t(
            { fr: 'Demandes des autres, obligations perso, tout ce qui flotte', en: 'Requests from others, self-imposed tasks, anything floating around', es: 'Peticiones de otros, tareas propias, todo lo que flota' }
          ).primary}
        </p>
      </div>
    );
  }

  /* ── Phase: SORTING ── */
  if (phase === 'sorting') {
    return (
      <div className="space-y-4 animate-fade-in-up">
        <p className="text-center text-sm text-muted-foreground">
          {t(
            { fr: 'Glisse chaque carte dans sa colonne', en: 'Drag each card to its column', es: 'Arrastra cada carta a su columna' }
          ).primary}
        </p>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Unsorted area */}
          {byBucket('unsorted').length > 0 && (
            <div className="space-y-2 p-3 rounded-2xl bg-muted/30 border border-border" id="zone-unsorted">
              {byBucket('unsorted').map((card) => (
                <DraggableCard key={card.id} card={card} />
              ))}
            </div>
          )}

          {/* Three buckets */}
          <div className="grid grid-cols-3 gap-2">
            <DropZone
              bucket="yes"
              label={t({ fr: 'Oui', en: 'Yes', es: 'Sí' }).primary}
              icon={<Check className="w-3.5 h-3.5" />}
              cards={byBucket('yes')}
              colorClass="border-primary/40 bg-primary/5"
            />
            <DropZone
              bucket="expand"
              label={t({ fr: 'Élargir', en: 'Expand', es: 'Expandir' }).primary}
              icon={<Sparkles className="w-3.5 h-3.5" />}
              cards={byBucket('expand')}
              colorClass="border-accent/40 bg-accent/5"
            />
            <DropZone
              bucket="notnow"
              label={t({ fr: 'Pas maintenant', en: 'Not Now', es: 'Ahora no' }).primary}
              icon={<Pause className="w-3.5 h-3.5" />}
              cards={byBucket('notnow')}
              colorClass="border-muted-foreground/20 bg-muted/20"
            />
          </div>

          <DragOverlay>
            {activeCard ? (
              <div className="px-3 py-2 rounded-xl bg-card border-2 border-primary shadow-lg text-sm text-foreground">
                {activeCard.text}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Continue to reflect */}
        {allSorted && (
          <div className="text-center pt-2 animate-fade-in-up">
            <Button variant="default" onClick={() => setPhase('reflecting')}>
              <ArrowRight className="w-4 h-4 mr-1" />
              {t({ fr: 'Voir le résultat', en: 'See the result', es: 'Ver el resultado' }).primary}
            </Button>
          </div>
        )}
      </div>
    );
  }

  /* ── Phase: REFLECTING ── */
  const yesCards = byBucket('yes');
  const expandCards = byBucket('expand');
  const notNowCards = byBucket('notnow');

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Summary */}
      <div className="text-center space-y-1">
        <p className="font-serif text-xl text-foreground">
          {t(
            { fr: `Tu as gardé ${yesCards.length}, lâché ${notNowCards.length}`, en: `You kept ${yesCards.length}, let go of ${notNowCards.length}`, es: `Guardaste ${yesCards.length}, soltaste ${notNowCards.length}` }
          ).primary}
        </p>
        <p className="text-sm text-muted-foreground italic">
          {t(
            { fr: `Tu as gardé ${yesCards.length}, lâché ${notNowCards.length}`, en: `You kept ${yesCards.length}, let go of ${notNowCards.length}`, es: `Guardaste ${yesCards.length}, soltaste ${notNowCards.length}` }
          ).secondary}
        </p>
      </div>

      {/* Yes cards — body-first prioritization */}
      {yesCards.length > 0 && (
        <div className="space-y-3">
          {yesCards.length >= 2 && !showAllYes ? (
            /* ── Carousel: one card at a time ── */
            <div className="space-y-4">
              <p className="text-center font-serif text-lg text-foreground">
                {t(
                  { fr: 'Laquelle t\'attire là, maintenant ?', en: 'Which one pulls you right now?', es: '¿Cuál te atrae ahora mismo?' }
                ).primary}
              </p>
              <p className="text-center text-sm text-muted-foreground italic">
                {t(
                  { fr: 'Laquelle t\'attire là, maintenant ?', en: 'Which one pulls you right now?', es: '¿Cuál te atrae ahora mismo?' }
                ).secondary}
              </p>

              {/* Single card display */}
              <button
                key={yesCards[pickIndex]?.id}
                onClick={() => onSelectGoal(yesCards[pickIndex].text)}
                className="w-full flex items-center gap-3 px-6 py-5 rounded-2xl bg-primary/10 border border-primary/20 text-foreground text-base text-left hover:bg-primary/20 hover:shadow-md transition-all animate-fade-in-up"
              >
                <Check className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="flex-1">{yesCards[pickIndex]?.text}</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* Navigation dots */}
              <div className="flex items-center justify-center gap-2">
                {yesCards.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPickIndex(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      i === pickIndex
                        ? 'bg-primary scale-125'
                        : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                    aria-label={`Card ${i + 1}`}
                  />
                ))}
              </div>

              {/* Show all fallback */}
              <button
                onClick={() => setShowAllYes(true)}
                className="block mx-auto text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              >
                {t({ fr: 'Tout voir', en: 'Show all', es: 'Ver todo' }).primary}
              </button>
            </div>
          ) : (
            /* ── List view: single card or "show all" mode ── */
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                {t({ fr: 'Choisis ton truc', en: 'Pick your One Thing', es: 'Elige tu cosa' }).primary}
              </p>
              {yesCards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => onSelectGoal(card.text)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 text-foreground text-sm text-left hover:bg-primary/20 hover:shadow-md transition-all"
                >
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="flex-1">{card.text}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Expand cards — gentle prompt */}
      {expandCards.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            {t({ fr: 'À reformuler', en: 'To reframe', es: 'Para reformular' }).primary}
          </p>
          {expandCards.map((card) => (
            <div
              key={card.id}
              className="px-4 py-3 rounded-xl bg-accent/5 border border-accent/20 text-foreground text-sm"
            >
              <span>{card.text}</span>
              <p className="text-xs text-muted-foreground mt-1 italic">
                {t(
                  { fr: 'Peux-tu le rendre plus petit ? Poser une condition ?', en: 'Can you make it smaller? Set a condition?', es: '¿Puedes hacerlo más pequeño? ¿Poner una condición?' }
                ).primary}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Not Now cards — compassionate dismissal */}
      {notNowCards.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            {t({ fr: 'Pas maintenant', en: 'Not Now', es: 'Ahora no' }).primary}
          </p>
          <div className="px-4 py-3 rounded-xl bg-muted/30 border border-border text-sm text-muted-foreground">
            {notNowCards.map((c) => c.text).join(' · ')}
            <p className="text-xs mt-2 italic">
              {t(
                { fr: 'Ça peut attendre. Tu as choisi ce qui compte.', en: 'These will wait. You chose what matters.', es: 'Pueden esperar. Elegiste lo que importa.' }
              ).primary}
            </p>
          </div>
        </div>
      )}

      {/* Reset */}
      <div className="text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setPhase('dumping');
            setCards([]);
            setPickIndex(0);
            setShowAllYes(false);
          }}
          className="text-muted-foreground"
        >
          {t({ fr: 'Recommencer', en: 'Start over', es: 'Empezar de nuevo' }).primary}
        </Button>
      </div>
    </div>
  );
}
