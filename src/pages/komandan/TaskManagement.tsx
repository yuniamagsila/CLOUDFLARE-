import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import TaskCard from '../../components/ui/TaskCard';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { TaskStatusBadge } from '../../components/common/Badge';
import { useTasks } from '../../hooks/useTasks';
import { useUsers } from '../../hooks/useUsers';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import type { Task, TaskStatus } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function TaskManagement() {
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  const { tasks, isLoading, createTask, updateTaskStatus } = useTasks({ assignedBy: user?.id });
  const { users } = useUsers({ role: 'prajurit', isActive: true });

  const [filterStatus, setFilterStatus] = useState<TaskStatus | ''>('');
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    judul: '',
    deskripsi: '',
    assigned_to: '',
    deadline: '',
    prioritas: 2 as 1 | 2 | 3,
  });

  const filtered = tasks.filter((t) => !filterStatus || t.status === filterStatus);

  const handleCreate = async () => {
    if (!form.judul || !form.assigned_to) {
      showNotification('Judul dan assignee wajib diisi', 'error');
      return;
    }
    setIsSaving(true);
    try {
      await createTask({
        ...form,
        satuan: user?.satuan,
      });
      showNotification('Tugas berhasil dibuat', 'success');
      setShowCreate(false);
      setForm({ judul: '', deskripsi: '', assigned_to: '', deadline: '', prioritas: 2 });
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Gagal membuat tugas', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async (task: Task) => {
    try {
      await updateTaskStatus(task.id, 'approved');
      showNotification('Tugas disetujui', 'success');
      setShowDetail(false);
    } catch {
      showNotification('Gagal menyetujui tugas', 'error');
    }
  };

  const handleReject = async (task: Task) => {
    try {
      await updateTaskStatus(task.id, 'rejected');
      showNotification('Tugas ditolak', 'warning');
      setShowDetail(false);
    } catch {
      showNotification('Gagal menolak tugas', 'error');
    }
  };

  const statusFilters: { value: TaskStatus | ''; label: string }[] = [
    { value: '', label: 'Semua' },
    { value: 'pending', label: 'Menunggu' },
    { value: 'in_progress', label: 'Dikerjakan' },
    { value: 'done', label: 'Selesai' },
    { value: 'approved', label: 'Disetujui' },
    { value: 'rejected', label: 'Ditolak' },
  ];

  return (
    <DashboardLayout title="Manajemen Tugas">
      <div className="space-y-5">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2 flex-wrap">
            {statusFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilterStatus(f.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === f.value
                    ? 'bg-primary text-white'
                    : 'bg-surface text-text-muted hover:text-text-primary'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="sm:ml-auto">
            <Button onClick={() => setShowCreate(true)}>+ Buat Tugas</Button>
          </div>
        </div>

        {/* Task list */}
        {isLoading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <div className="bg-bg-card border border-surface rounded-xl p-8 text-center text-text-muted">
            Tidak ada tugas
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {filtered.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                showAssignee
                actionLabel={task.status === 'done' ? 'Tinjau' : 'Detail'}
                onAction={() => {
                  setSelectedTask(task);
                  setShowDetail(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Buat Tugas Baru"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Batal</Button>
            <Button onClick={handleCreate} isLoading={isSaving}>Buat Tugas</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Judul Tugas *" type="text" value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} required />
          <div>
            <label className="text-sm font-medium text-text-primary">Deskripsi</label>
            <textarea
              className="mt-1 w-full rounded-lg border border-surface bg-bg-card px-3 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
              rows={3}
              placeholder="Detail tugas yang harus dilakukan..."
              value={form.deskripsi}
              onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-text-primary">Ditugaskan ke *</label>
            <select
              className="mt-1 w-full rounded-lg border border-surface bg-bg-card px-3 py-2 text-text-primary focus:outline-none focus:border-primary"
              value={form.assigned_to}
              onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
            >
              <option value="">Pilih Personel...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.pangkat ? `${u.pangkat} ` : ''}{u.nama} — {u.nrp}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-text-primary">Prioritas</label>
              <select
                className="mt-1 w-full rounded-lg border border-surface bg-bg-card px-3 py-2 text-text-primary focus:outline-none focus:border-primary"
                value={form.prioritas}
                onChange={(e) => setForm({ ...form, prioritas: Number(e.target.value) as 1 | 2 | 3 })}
              >
                <option value={1}>1 — Tinggi</option>
                <option value={2}>2 — Sedang</option>
                <option value={3}>3 — Rendah</option>
              </select>
            </div>
            <Input label="Deadline" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </div>
        </div>
      </Modal>

      {/* Task Detail Modal */}
      {selectedTask && (
        <Modal
          isOpen={showDetail}
          onClose={() => setShowDetail(false)}
          title="Detail Tugas"
          size="md"
          footer={
            selectedTask.status === 'done' ? (
              <>
                <Button variant="ghost" onClick={() => setShowDetail(false)}>Tutup</Button>
                <Button variant="danger" onClick={() => handleReject(selectedTask)}>Tolak</Button>
                <Button onClick={() => handleApprove(selectedTask)}>Setujui</Button>
              </>
            ) : (
              <Button variant="ghost" onClick={() => setShowDetail(false)}>Tutup</Button>
            )
          }
        >
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-text-primary">{selectedTask.judul}</h3>
              <TaskStatusBadge status={selectedTask.status} />
            </div>
            {selectedTask.deskripsi && <p className="text-sm text-text-muted">{selectedTask.deskripsi}</p>}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-text-muted">Assignee:</span> <span className="text-text-primary">{selectedTask.assignee?.nama ?? '—'}</span></div>
              <div><span className="text-text-muted">NRP:</span> <span className="font-mono text-text-primary">{selectedTask.assignee?.nrp ?? '—'}</span></div>
              <div><span className="text-text-muted">Prioritas:</span> <span className="text-text-primary">{selectedTask.prioritas}</span></div>
              <div><span className="text-text-muted">Deadline:</span> <span className="text-text-primary">{selectedTask.deadline ? new Date(selectedTask.deadline).toLocaleDateString('id-ID') : '—'}</span></div>
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
