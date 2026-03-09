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
  return (
    <div className={`flex-1 min-h-[100px] rounded-2xl border-2 border-dashed p-3 space-y-2 transition-colors ${colorClass}`}>
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
  const inputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const placeholders = [
    t('Répondre au courriel du patron', 'Reply to boss email', 'Responder al correo del jefe').primary,
    t('Finir le ménage', 'Finish laundry', 'Terminar la colada').primary,
    t('Appeler le dentiste', 'Call the dentist', 'Llamar al dentista').primary,
    t('Préparer le souper', 'Make dinner', 'Preparar la cena').primary,
    t('Payer les factures', 'Pay bills', 'Pagar las facturas').primary,
    t('Répondre à ce message', 'Reply to that text', 'Responder a ese mensaje').primary,
    t('Ranger le bureau', 'Tidy the desk', 'Ordenar el escritorio').primary,
    t('Acheter des courses', 'Buy groceries', 'Comprar comestibles').primary,
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
              'Qu\'est-ce qui pèse en ce moment ?',
              'What\'s weighing on you right now?',
              '¿Qué te pesa en este momento?'
            ).primary}
          </p>
          <p className="text-sm text-muted-foreground italic mt-1">
            {t(
              'Qu\'est-ce qui pèse en ce moment ?',
              'What\'s weighing on you right now?',
              '¿Qué te pesa en este momento?'
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
            {t('8 max — on garde ça gérable', '8 max — keeping it manageable', '8 máx — manteniéndolo manejable').primary}
          </p>
        )}

        {/* Continue */}
        {cards.length >= 2 && (
          <Button variant="default" onClick={() => setPhase('sorting')}>
            <ArrowRight className="w-4 h-4 mr-1" />
            {t('Trier', 'Sort', 'Clasificar').primary}
          </Button>
        )}

        <p className="text-xs text-muted-foreground/50">
          {t(
            'Demandes des autres, obligations perso, tout ce qui flotte',
            'Requests from others, self-imposed tasks, anything floating around',
            'Peticiones de otros, tareas propias, todo lo que flota'
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
            'Glisse chaque carte dans sa colonne',
            'Drag each card to its column',
            'Arrastra cada carta a su columna'
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
              label={t('Oui', 'Yes', 'Sí').primary}
              icon={<Check className="w-3.5 h-3.5" />}
              cards={byBucket('yes')}
              colorClass="border-primary/40 bg-primary/5"
            />
            <DropZone
              bucket="expand"
              label={t('Élargir', 'Expand', 'Expandir').primary}
              icon={<Sparkles className="w-3.5 h-3.5" />}
              cards={byBucket('expand')}
              colorClass="border-accent/40 bg-accent/5"
            />
            <DropZone
              bucket="notnow"
              label={t('Pas maintenant', 'Not Now', 'Ahora no').primary}
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
              {t('Voir le résultat', 'See the result', 'Ver el resultado').primary}
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
            `Tu as gardé ${yesCards.length}, lâché ${notNowCards.length}`,
            `You kept ${yesCards.length}, let go of ${notNowCards.length}`,
            `Guardaste ${yesCards.length}, soltaste ${notNowCards.length}`
          ).primary}
        </p>
        <p className="text-sm text-muted-foreground italic">
          {t(
            `Tu as gardé ${yesCards.length}, lâché ${notNowCards.length}`,
            `You kept ${yesCards.length}, let go of ${notNowCards.length}`,
            `Guardaste ${yesCards.length}, soltaste ${notNowCards.length}`
          ).secondary}
        </p>
      </div>

      {/* Yes cards — tappable to select as goal */}
      {yesCards.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            {t('Choisis ton truc', 'Pick your One Thing', 'Elige tu cosa').primary}
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

      {/* Expand cards — gentle prompt */}
      {expandCards.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            {t('À reformuler', 'To reframe', 'Para reformular').primary}
          </p>
          {expandCards.map((card) => (
            <div
              key={card.id}
              className="px-4 py-3 rounded-xl bg-accent/5 border border-accent/20 text-foreground text-sm"
            >
              <span>{card.text}</span>
              <p className="text-xs text-muted-foreground mt-1 italic">
                {t(
                  'Peux-tu le rendre plus petit ? Poser une condition ?',
                  'Can you make it smaller? Set a condition?',
                  '¿Puedes hacerlo más pequeño? ¿Poner una condición?'
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
            {t('Pas maintenant', 'Not Now', 'Ahora no').primary}
          </p>
          <div className="px-4 py-3 rounded-xl bg-muted/30 border border-border text-sm text-muted-foreground">
            {notNowCards.map((c) => c.text).join(' · ')}
            <p className="text-xs mt-2 italic">
              {t(
                'Ça peut attendre. Tu as choisi ce qui compte.',
                'These will wait. You chose what matters.',
                'Pueden esperar. Elegiste lo que importa.'
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
          }}
          className="text-muted-foreground"
        >
          {t('Recommencer', 'Start over', 'Empezar de nuevo').primary}
        </Button>
      </div>
    </div>
  );
}
