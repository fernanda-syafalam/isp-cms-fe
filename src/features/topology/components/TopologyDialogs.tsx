import type { NetworkTopology } from '../hooks/useNetworkTopology'
import { CableFormDialog } from './CableFormDialog'
import { InstallCustomerDialog } from './InstallCustomerDialog'
import { NodeFormDialog } from './NodeFormDialog'

type Props = Pick<
  NetworkTopology,
  | 'all'
  | 'form'
  | 'setForm'
  | 'installOpen'
  | 'setInstallOpen'
  | 'installPoint'
  | 'setInstallPoint'
  | 'cableOpen'
  | 'setCableOpen'
  | 'handlePick'
>

// The three modals driven by topology state: node add/edit, customer install,
// and cable creation. Each mounts only while its state is open.
export function TopologyDialogs({
  all,
  form,
  setForm,
  installOpen,
  setInstallOpen,
  installPoint,
  setInstallPoint,
  cableOpen,
  setCableOpen,
  handlePick,
}: Props) {
  return (
    <>
      {form ? (
        <NodeFormDialog
          open
          onOpenChange={(o) => {
            if (!o) setForm(null)
          }}
          nodes={all}
          {...('node' in form ? { node: form.node } : { latLng: form.latLng })}
        />
      ) : null}

      {installOpen ? (
        <InstallCustomerDialog
          open
          onOpenChange={(o) => {
            setInstallOpen(o)
            if (!o) setInstallPoint(null)
          }}
          nodes={all}
          latLng={installPoint ?? undefined}
          onInstalled={handlePick}
        />
      ) : null}

      {cableOpen ? <CableFormDialog nodes={all} open onOpenChange={setCableOpen} /> : null}
    </>
  )
}
