'use client'

import { useMemo } from 'react'

import { SelectInput, useField, useFormFields } from '@payloadcms/ui'
import { mergeFieldStyles } from '@payloadcms/ui/shared'
import type { TextFieldClientComponent } from 'payload'

type Option = { label: string; value: string }

/** `layout.2.openings.4.group` -> `layout.2.groups` (the sibling Groups array of the same block). */
const groupsPathFor = (path: string) => {
  const parts = path.split('.')
  const index = parts.lastIndexOf('openings')
  return [...parts.slice(0, index < 0 ? parts.length - 1 : index), 'groups'].join('.')
}

/**
 * Stores the id of a row in the block's Groups array, offering the group names as a dropdown so an
 * opening always points at a configured heading (and survives the heading being renamed).
 */
export const CareersGroupField: TextFieldClientComponent = ({ field, path, readOnly }) => {
  const { setValue, showError, value } = useField<string | null>({ path })
  const groupsPath = useMemo(() => groupsPathFor(path), [path])

  // Serialised so the selector returns a stable value between unrelated form updates.
  const optionsJson = useFormFields(([fields]) => {
    const rows = fields?.[groupsPath]?.rows ?? []
    const options: Option[] = []
    rows.forEach((row, index) => {
      const name = fields?.[`${groupsPath}.${index}.name`]?.value
      const id = row?.id ?? fields?.[`${groupsPath}.${index}.id`]?.value
      if (typeof id === 'string' && typeof name === 'string' && name.trim()) {
        options.push({ label: name.trim(), value: id })
      }
    })
    return JSON.stringify(options)
  })
  const options = useMemo(() => JSON.parse(optionsJson) as Option[], [optionsJson])
  // Applies the admin `width` so the field keeps its column in a row, like built-in fields.
  const style = useMemo(() => mergeFieldStyles(field), [field])

  return (
    <SelectInput
      description={field.admin?.description}
      isClearable
      label={field.label}
      name={field.name}
      onChange={(selected) => {
        const option = Array.isArray(selected) ? selected[0] : selected
        setValue(option && typeof option.value === 'string' ? option.value : null)
      }}
      options={options}
      path={path}
      placeholder={options.length ? 'Select a group' : 'Add groups above first'}
      readOnly={readOnly}
      required={field.required}
      showError={showError}
      style={style}
      value={value ?? undefined}
    />
  )
}
